"""
from celery import shared_task
from django.db.models.signals import post_save
from zk import ZK, const
from biometricdata.models import BiometricData
from datetime import datetime

# Replace with your ZKTeco device details
ZKTECO_IP = "192.168.1.201"
ZKTECO_PORT = 4370


@shared_task
def fetch_new_biometric_data():
    # Fetch biometric attendance logs from the ZKTeco device and store only new records in the database
    zk = ZK(ZKTECO_IP, port=ZKTECO_PORT, timeout=5, password=0, force_udp=False, ommit_ping=False)
    conn = None

    try:
        # Connect to the device
        conn = zk.connect()
        conn.disable_device()  # Prevent interference during data retrieval

        logs = conn.get_attendance()  # Fetch attendance logs
        new_entries = []

        for log in logs:
            emp_id = log.user_id
            time = log.timestamp

            # Check if the record already exists
            if not BiometricData.objects.filter(emp_id=emp_id, time=time).exists():
                biometric_entry = BiometricData(
                    emp_id=emp_id,
                    name=f"Employee {emp_id}",  # Modify to fetch real names if available
                    time=time,
                    work_code="N/A",
                    work_state=str(log.status),  # Can be mapped to 'Check-in', 'Check-out', etc.
                    terminal_name="ZKTeco Terminal"
                )
                new_entries.append(biometric_entry)

        if new_entries:
            BiometricData.objects.bulk_create(new_entries)

            # Manually trigger post_save signals for each entry
            for entry in new_entries:
                post_save.send(sender=BiometricData, instance=entry, created=True)

        conn.enable_device()  # Re-enable the device
        return f"Successfully added {len(new_entries)} new biometric entries."

    except Exception as e:
        return f"Error fetching biometric data: {str(e)}"

    finally:
        if conn:
            conn.disconnect()
"""