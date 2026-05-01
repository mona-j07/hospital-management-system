#include "hospital.h"

float calculate_salary(int experience, int total_minutes, int surgeries, int isDoctor) {
    float rate;

    if (isDoctor)
        rate = 1000 + (experience * 50);
    else
        rate = 200 + (experience * 20);

    float hours = total_minutes / 60.0;

    float base_hours = hours > 8 ? 8 : hours;
    float overtime_hours = hours > 8 ? (hours - 8) : 0;

    float base_pay = base_hours * rate;
    float overtime_pay = overtime_hours * rate * 1.5;

    float bonus = 0;
    if (surgeries > 5) {
        bonus = isDoctor ? 2000 : 800;
    }

    return base_pay + overtime_pay + bonus;
}
