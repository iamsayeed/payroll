from decimal import Decimal

def compute_pagibig_contribution():

    employee_share = Decimal(200) /2
    employer_share = Decimal(200) /2

    total_contribution =  employee_share + employer_share

    return {
        "Employee Share": Decimal(employee_share),
        "Employer Share": Decimal(employer_share),
        "Total Contribution": Decimal(total_contribution),
    }