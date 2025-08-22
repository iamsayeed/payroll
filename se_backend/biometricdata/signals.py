from django.db.models.signals import post_save
from django.dispatch import receiver
from biometricdata.models import BiometricData
from attendance.models import Attendance
from employment_info.models import EmploymentInfo
from employees.models import Employee
from admins.models import Admin
from django.utils.timezone import localtime

@receiver(post_save, sender=BiometricData)
def update_attendance(sender, instance, **kwargs):
    emp_id = instance.emp_id  # Get emp_id from BiometricData
    record_date = localtime(instance.time).date()  # Convert timestamp to local date
    record_time = localtime(instance.time).time()  # Extract only the time

    try:
        # Step 1: Get EmploymentInfo using emp_id (employee_number)
        employment_info = EmploymentInfo.objects.get(employee_number=emp_id)

        # Step 2: Check if an Employee or Admin is linked to it
        employee = Employee.objects.filter(employment_info=employment_info).first()
        admin = Admin.objects.filter(employment_info=employment_info).first()

        if employee:
            user = employee.user  # Employee's user account
        elif admin:
            user = admin.user  # Admin's user account
        else:
            print(f"No associated user found for emp_id {emp_id}. Skipping attendance update.")
            return  # Stop execution if no user is found

        # Step 3: Get or create Attendance record for the user on the same date
        attendance, created = Attendance.objects.get_or_create(
            user=user,  # Link user via ForeignKey
            date=record_date,
            defaults={
                "check_in_time": record_time,
                "check_out_time": record_time,  # Default check-out = check-in initially
                "status": "Present",
            }
        )

        # Step 4: If the user scans again later, update check-out time
        if not created and record_time > attendance.check_out_time:
            attendance.check_out_time = record_time
            attendance.save()

    except EmploymentInfo.DoesNotExist:
        print(f"EmploymentInfo not found for emp_id {emp_id}. Skipping update.")
