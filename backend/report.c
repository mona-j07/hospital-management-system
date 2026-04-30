#include <stdio.h>
#include <stdlib.h>
#include "hospital.h"

void export_json() {
    FILE *f = fopen("../frontend/public/output.json", "w");
    if (!f) f = fopen("output.json", "w"); 
    if (!f) return;

    fprintf(f, "{\n");
    fprintf(f, "  \"surgeries\": [\n");
    for (int i = 0; i < num_surgeries; i++) {
        fprintf(f, "    {\n");
        fprintf(f, "      \"id\": %d,\n", surgeries[i].id);
        fprintf(f, "      \"patient\": %d,\n", surgeries[i].patient_id);
        
        char surg_name[50] = "Unknown";
        for (int x = 0; x < num_surgeons; x++) {
            if (surgeons[x].id == surgeries[i].surgeon_id) {
                snprintf(surg_name, sizeof(surg_name), "%s", surgeons[x].name);
                break;
            }
        }
        
        fprintf(f, "      \"surgeon\": \"%s\",\n", surg_name);
        fprintf(f, "      \"type\": \"%s\",\n", surgeries[i].type);
        fprintf(f, "      \"duration\": %d,\n", surgeries[i].duration);
        fprintf(f, "      \"ot\": %d,\n", surgeries[i].assigned_ot);
        fprintf(f, "      \"start_slot\": %d,\n", surgeries[i].start_slot);
        fprintf(f, "      \"end_slot\": %d\n", surgeries[i].end_slot);
        fprintf(f, "    }%s\n", (i == num_surgeries - 1) ? "" : ",");
    }
    fprintf(f, "  ],\n");

    fprintf(f, "  \"surgeons\": [\n");
    for (int i = 0; i < num_surgeons; i++) {
        fprintf(f, "    {\n");
        fprintf(f, "      \"id\": %d,\n", surgeons[i].id);
        fprintf(f, "      \"name\": \"%s\",\n", surgeons[i].name);
        
        int surg_count = 0;
        for (int s = 0; s < num_surgeries; s++) {
            if (surgeries[s].surgeon_id == surgeons[i].id && surgeries[s].assigned_ot != -1) {
                surg_count++;
            }
        }
        fprintf(f, "      \"surgeries_count\": %d,\n", surg_count);
        fprintf(f, "      \"worked_hours\": %d,\n", surgeons[i].worked_hours);
        fprintf(f, "      \"salary\": %.2f\n", calculate_salary(surgeons[i].worked_hours, surgeons[i].rate, 0));
        fprintf(f, "    }%s\n", (i == num_surgeons - 1) ? "" : ",");
    }
    fprintf(f, "  ],\n");

    fprintf(f, "  \"nurses\": [\n");
    for (int i = 0; i < num_nurses; i++) {
        fprintf(f, "    {\n");
        fprintf(f, "      \"id\": %d,\n", nurses[i].id);
        fprintf(f, "      \"name\": \"%s\",\n", nurses[i].name);
        fprintf(f, "      \"worked_hours\": %d,\n", nurses[i].worked_hours);
        fprintf(f, "      \"salary\": %.2f\n", calculate_salary(nurses[i].worked_hours, nurses[i].rate, 0));
        fprintf(f, "    }%s\n", (i == num_nurses - 1) ? "" : ",");
    }
    fprintf(f, "  ]\n");

    fprintf(f, "}\n");
    fclose(f);
}
