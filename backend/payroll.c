#include "hospital.h"

float calculate_salary(int hours, int surgeries, float rate) {
    float salary = hours * rate;

    if (hours > 8) {
        salary += (hours - 8) * rate * 1.5;
    }

    if (surgeries > 5) {
        salary += 1000; // bonus
    }

    return salary;
}
