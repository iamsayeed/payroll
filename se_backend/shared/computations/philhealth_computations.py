from decimal import Decimal

def compute_philhealth_contribution(basic_salary):

    basic_salary = Decimal(basic_salary)
    total_contribution = basic_salary * Decimal(.05) / 2

    return {
        "Basic Salary": Decimal(basic_salary),
        "Total Contribution": Decimal(total_contribution),
    }
