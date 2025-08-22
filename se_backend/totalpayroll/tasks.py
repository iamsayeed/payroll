from celery import shared_task
from django.db.models import Sum, Max, Min
from django.utils.timezone import now

from payroll.models import Payroll
from .models import TotalPayroll


@shared_task
def calculate_total_payroll():
    today = now().date()

    # Get the latest past pay date
    previous_paydate = Payroll.objects.filter(pay_date__lt=today).aggregate(Max('pay_date'))['pay_date__max']

    # Get the soonest upcoming pay date
    upcoming_paydate = Payroll.objects.filter(pay_date__gt=today).aggregate(Min('pay_date'))['pay_date__min']

    previous_total = None
    upcoming_total = None

    if previous_paydate:
        previous_total = Payroll.objects.filter(pay_date=previous_paydate).aggregate(Sum('net_pay'))[
                             'net_pay__sum'] or 0

    if upcoming_paydate:
        upcoming_total = Payroll.objects.filter(pay_date=upcoming_paydate).aggregate(Sum('net_pay'))[
                             'net_pay__sum'] or 0


    obj, created = TotalPayroll.objects.get_or_create(id=1)

    obj.previous_paydate = previous_paydate
    obj.previous_payroll = previous_total
    obj.upcoming_paydate = upcoming_paydate
    obj.upcoming_payroll = upcoming_total
    obj.save()

    return f"TotalPayroll updated: Previous - {previous_total} on {previous_paydate}, Upcoming - {upcoming_total} on {upcoming_paydate}"
