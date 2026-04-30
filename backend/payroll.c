#include "hospital.h"

float calculate_salary(int hours, float rate, int overtime) {
    float base = hours * rate;
    float extra = overtime * rate * 1.5;
    return base + extra;
}
