from decimal import Decimal

def compute_sss_contribution(basic_salary):
    original_salary = Decimal(basic_salary)  # Store the original salary input

    # Ensure minimum salary credit is ₱5,000 if salary is below that
    if basic_salary < 5000:
        basic_salary = 5000

    # SSS Contribution Table (Effective January 2025)
    sss_table = [
        (5000, 5000, 500, 250, 10, 0, 0),
        (5250, 5500, 550, 275, 10, 0, 0),
        (5750, 6000, 600, 300, 10, 0, 0),
        (6250, 6500, 650, 325, 10, 0, 0),
        (6750, 7000, 700, 350, 10, 0, 0),
        (7250, 7500, 750, 375, 10, 0, 0),
        (7750, 8000, 800, 400, 10, 0, 0),
        (8250, 8500, 850, 425, 10, 0, 0),
        (8750, 9000, 900, 450, 10, 0, 0),
        (9250, 9500, 950, 475, 10, 0, 0),
        (9750, 10000, 1000, 500, 10, 0, 0),
        (10250, 10500, 1050, 525, 10, 0, 0),
        (10750, 11000, 1100, 550, 10, 0, 0),
        (11250, 11500, 1150, 575, 10, 0, 0),
        (11750, 12000, 1200, 600, 10, 0, 0),
        (12250, 12500, 1250, 625, 10, 0, 0),
        (12750, 13000, 1300, 650, 10, 0, 0),
        (13250, 13500, 1350, 675, 10, 0, 0),
        (13750, 14000, 1400, 700, 10, 0, 0),
        (14250, 14500, 1450, 725, 10, 0, 0),
        (14750, 15000, 1500, 750, 30, 0, 0),
        (15250, 15500, 1550, 775, 30, 0, 0),
        (15750, 16000, 1600, 800, 30, 0, 0),
        (16250, 16500, 1650, 825, 30, 0, 0),
        (16750, 17000, 1700, 850, 30, 0, 0),
        (17250, 17500, 1750, 875, 30, 0, 0),
        (17750, 18000, 1800, 900, 30, 0, 0),
        (18250, 18500, 1850, 925, 30, 0, 0),
        (18750, 19000, 1900, 950, 30, 0, 0),
        (19250, 19500, 1950, 975, 30, 0, 0),
        (19750, 20000, 2000, 1000, 30, 0, 0),
        (20250, 22000, 2000, 1000, 30, 50, 25),
        (20750, 21000, 2000, 1000, 30, 100, 50),
        (21250, 21500, 2000, 1000, 30, 150, 75),
        (21750, 22000, 2000, 1000, 30, 200, 100),
        (22250, 22500, 2000, 1000, 30, 250, 125),
        (22750, 23000, 2000, 1000, 30, 300, 150),
        (23250, 23500, 2000, 1000, 30, 350, 175),
        (23750, 24000, 2000, 1000, 30, 400, 200),
        (24250, 24500, 2000, 1000, 30, 450, 225),
        (24750, 25000, 2000, 1000, 30, 500, 250),
        (25250, 25500, 2000, 1000, 30, 550, 275),
        (25750, 26000, 2000, 1000, 30, 600, 300),
        (26250, 26500, 2000, 1000, 30, 650, 325),
        (26750, 27000, 2000, 1000, 30, 700, 350),
        (27250, 27500, 2000, 1000, 30, 750, 375),
        (27750, 28000, 2000, 1000, 30, 800, 400),
        (28250, 28500, 2000, 1000, 30, 850, 425),
        (28750, 29000, 2000, 1000, 30, 900, 450),
        (29250, 29500, 2000, 1000, 30, 950, 475),
        (29750, 30000, 2000, 1000, 30, 1000, 500),
        (30250, 30500, 2000, 1000, 30, 1050, 525),
        (30750, 31000, 2000, 1000, 30, 1100, 550),
        (31250, 31500, 2000, 1000, 30, 1150, 575),
        (31750, 32000, 2000, 1000, 30, 1200, 600),
        (32250, 32500, 2000, 1000, 30, 1250, 625),
        (32750, 33000, 2000, 1000, 30, 1300, 650),
        (33250, 33500, 2000, 1000, 30, 1350, 675),
        (33750, 34000, 2000, 1000, 30, 1400, 700),
        (34250, 34500, 2000, 1000, 30, 1450, 725),
        (34750, 35000, 2000, 1000, 30, 1500, 750),
    ]

    # Determine the correct SSS contributions based on the salary
    for min_salary, msc, employer_ss, employee_ss, ec, er_mpf, ee_mpf in sss_table:
        if basic_salary >= min_salary:
            selected_msc = msc /2
            employer_contribution = employer_ss /2
            employee_contribution = employee_ss /2
            ec_contribution = ec /2
            er_mpf_contribution = er_mpf /2
            ee_mpf_contribution = ee_mpf /2
        else:
            break  # Stop at the correct salary bracket

    # Total Employer Contribution = Employer SS + EC + MPF
    total_employer = employer_contribution + ec_contribution + er_mpf_contribution
    # Total Employee Contribution = Employee SS + MPF
    total_employee = employee_contribution + ee_mpf_contribution
    # Total Contribution (Both Employer & Employee)
    total_contribution = total_employer + total_employee

    return {
        "Basic Salary": original_salary,  # Show the original salary input
        "MSC": Decimal(selected_msc),
        "Employee Share": Decimal(employee_contribution),
        "Employer Share": Decimal(employer_contribution),
        "EC Contribution": Decimal(ec_contribution),
        "Employer MPF Contribution": Decimal(er_mpf_contribution),
        "Employee MPF Contribution": Decimal(ee_mpf_contribution),
        "Total Employer Contribution": Decimal(total_employer),
        "Total Employee Contribution": Decimal(total_employee),
        "Total Contribution": Decimal(total_contribution),
    }
