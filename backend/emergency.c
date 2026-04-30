#include <stdio.h>
#include "hospital.h"

void insert_emergency(Surgery *emergency, int *n) {
    emergency->priority = 1;
    
    if (*n < MAX) {
        surgeries[*n] = *emergency;
        (*n)++;
    }
    
    for (int i = 0; i < num_ots; i++) {
        for (int j = 0; j < MAX_SLOTS; j++) ots[i].schedule[j] = 0;
    }
    for (int i = 0; i < num_surgeons; i++) {
        surgeons[i].worked_hours = 0;
        for (int j = 0; j < MAX_SLOTS; j++) surgeons[i].schedule[j] = 0;
    }
    for (int i = 0; i < *n; i++) {
        surgeries[i].assigned_ot = -1;
        surgeries[i].start_slot = -1;
        surgeries[i].end_slot = -1;
    }
    
    generate_schedule(surgeries, *n, ots, num_ots);
}
