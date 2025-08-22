import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Earnings
from benefits.models import SSS, Philhealth, Pagibig
from shared.computations.sss_computations import compute_sss_contribution
from shared.computations.philhealth_computations import compute_philhealth_contribution
from shared.computations.pagibig_computations import compute_pagibig_contribution

# Configure logger
logger = logging.getLogger(__name__)


@receiver(post_save, sender=Earnings)
def update_sss_contribution(sender, instance, **kwargs):
    """Signal triggered when an Earnings entry is created or updated."""
    logger.info(f"Signal triggered for user: {instance.user.id}, Earnings ID: {instance.id}")

    if instance.basic_rate is not None:
        logger.info(f"Computing SSS contribution for basic_rate: {instance.basic_rate}")

        sss_data = compute_sss_contribution(instance.basic_rate)

        logger.info(f"Computed SSS Data: {sss_data}")

        # Save or update the SSS contribution for the user
        sss_record, created = SSS.objects.update_or_create(
            user=instance.user,
            defaults={
                "basic_salary": sss_data["Basic Salary"],
                "msc": sss_data["MSC"],
                "employee_share": sss_data["Employee Share"],
                "employer_share": sss_data["Employer Share"],
                "ec_contribution": sss_data["EC Contribution"],
                "employer_mpf_contribution": sss_data["Employer MPF Contribution"],
                "employee_mpf_contribution": sss_data["Employee MPF Contribution"],
                "total_employer": sss_data["Total Employer Contribution"],
                "total_employee": sss_data["Total Employee Contribution"],
                "total_contribution": sss_data["Total Contribution"],
            }
        )

        if created:
            logger.info(f"Created new SSS record for user: {instance.user.id}, Contribution ID: {sss_record.id}")
        else:
            logger.info(f"Updated existing SSS record for user: {instance.user.id}, Contribution ID: {sss_record.id}")
    else:
        logger.warning(f"Basic rate is None for user: {instance.user.id}, skipping computation.")

@receiver(post_save, sender=Earnings)
def update_philhealth_contribution(sender, instance, **kwargs):
    """Signal triggered when an Earnings entry is created or updated."""
    logger.info(f"Signal triggered for user: {instance.user.id}, Earnings ID: {instance.id}")

    if instance.basic_rate is not None:
        logger.info(f"Computing Philhealth contribution for basic_rate: {instance.basic_rate}")

        philhealth_data = compute_philhealth_contribution(instance.basic_rate)

        logger.info(f"Computed Philhealth Data: {philhealth_data}")

        # Save or update the Philhealth contribution for the user
        philhealth_record, created = Philhealth.objects.update_or_create(
            user=instance.user,
            defaults={
                "basic_salary": philhealth_data["Basic Salary"],
                "total_contribution": philhealth_data["Total Contribution"],
            }
        )

        if created:
            logger.info(f"Created new Philhealth record for user: {instance.user.id}, Contribution ID: {philhealth_record.id}")
        else:
            logger.info(f"Updated existing Philhealth record for user: {instance.user.id}, Contribution ID: {philhealth_record.id}")
    else:
        logger.warning(f"Basic rate is None for user: {instance.user.id}, skipping computation.")



@receiver(post_save, sender=Earnings)
def update_pagibig_contribution(sender, instance, **kwargs):
    """Signal triggered when an Earnings entry is created or updated."""
    logger.info(f"Signal triggered for user: {instance.user.id}, Earnings ID: {instance.id}")

    if instance.basic_rate is not None:
        logger.info(f"Computing Pagibig contribution for basic_rate: {instance.basic_rate}")

        pagibig_data = compute_pagibig_contribution()

        logger.info(f"Computed Pagibig Data: {pagibig_data}")

        # Ensure only one Pagibig record per user
        pagibig_record, created = Pagibig.objects.get_or_create(user=instance.user)

        # Update existing record
        pagibig_record.basic_salary = instance.basic_rate
        pagibig_record.employee_share = pagibig_data["Employee Share"]
        pagibig_record.employer_share = pagibig_data["Employer Share"]
        pagibig_record.total_contribution = pagibig_data["Total Contribution"]
        pagibig_record.save()

        if created:
            logger.info(f"Created new Pagibig record for user: {instance.user.id}, Contribution ID: {pagibig_record.id}")
        else:
            logger.info(f"Updated existing Pagibig record for user: {instance.user.id}, Contribution ID: {pagibig_record.id}")

    else:
        logger.warning(f"Basic rate is None for user: {instance.user.id}, skipping computation.")
