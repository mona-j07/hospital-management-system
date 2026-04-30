#include "hospital.h"

int slots_needed(int duration_minutes) {
    return (duration_minutes + 29) / 30; // 30 mins per slot
}
