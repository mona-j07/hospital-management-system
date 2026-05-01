#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "hospital.h"

void read_input() {
    FILE *f = fopen("input.txt", "r");
    if (!f) {
        printf("Could not open input.txt. Using defaults or empty data.\n");
        return;
    }

    char label[50];
    while (fscanf(f, "%s", label) != EOF) {
        if (strcmp(label, "SURGERIES") == 0) {
            fscanf(f, "%d", &num_surgeries);
            for (int i = 0; i < num_surgeries; i++) {
                fscanf(f, "%d %s %s %d %d %d %d %s %d %s %d %d", 
                    &surgeries[i].id, 
                    surgeries[i].type, 
                    surgeries[i].urgency,
                    &surgeries[i].patient_id, 
                    &surgeries[i].surgeon_id, 
                    &surgeries[i].required_nurses, 
                    &surgeries[i].duration, 
                    surgeries[i].equipment, 
                    &surgeries[i].priority,
                    surgeries[i].date,
                    &surgeries[i].start_slot,
                    &surgeries[i].end_slot);
                surgeries[i].assigned_ot = -1;
            }
        } else if (strcmp(label, "OTS") == 0) {
            fscanf(f, "%d", &num_ots);
            for (int i = 0; i < num_ots; i++) {
                fscanf(f, "%d %s %s %s %d", 
                    &ots[i].id, 
                    ots[i].name,
                    ots[i].type,
                    ots[i].equipment, 
                    &ots[i].is_available);
                for(int j=0; j<MAX_SLOTS; j++) ots[i].schedule[j] = 0;
            }
        } else if (strcmp(label, "SURGEONS") == 0) {
            fscanf(f, "%d", &num_surgeons);
            for (int i = 0; i < num_surgeons; i++) {
                fscanf(f, "%d %s %s %s %d %d %f", 
                    &surgeons[i].id, 
                    surgeons[i].name, 
                    surgeons[i].position,
                    surgeons[i].specialization, 
                    &surgeons[i].experience,
                    &surgeons[i].max_hours, 
                    &surgeons[i].rate);
                surgeons[i].worked_hours = 0;
                for(int j=0; j<MAX_SLOTS; j++) surgeons[i].schedule[j] = 0;
            }
        } else if (strcmp(label, "NURSES") == 0) {
            fscanf(f, "%d", &num_nurses);
            for (int i = 0; i < num_nurses; i++) {
                fscanf(f, "%d %s %s %s %d %d %f", 
                    &nurses[i].id, 
                    nurses[i].name, 
                    nurses[i].position,
                    nurses[i].specialization, 
                    &nurses[i].experience,
                    &nurses[i].max_hours, 
                    &nurses[i].rate);
                nurses[i].worked_hours = 0;
                for(int j=0; j<MAX_SLOTS; j++) nurses[i].schedule[j] = 0;
            }
        }
    }
    fclose(f);
    printf("Data loaded from input.txt\n");
}
