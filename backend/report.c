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
        fprintf(f, "      \"assigned_nurses\": [");
        for(int k=0; k < surgeries[i].num_assigned_nurses; k++) {
            char nurse_name[50] = "Unknown";
            for (int n_idx = 0; n_idx < num_nurses; n_idx++) {
                if (nurses[n_idx].id == surgeries[i].assigned_nurses[k]) {
                    snprintf(nurse_name, sizeof(nurse_name), "%s", nurses[n_idx].name);
                    break;
                }
            }
            fprintf(f, "\"%s\"%s", nurse_name, (k == surgeries[i].num_assigned_nurses - 1) ? "" : ", ");
        }
        fprintf(f, "],\n");
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
        fprintf(f, "      \"position\": \"%s\",\n", surgeons[i].position);
        fprintf(f, "      \"specialization\": \"%s\",\n", surgeons[i].specialization);
        fprintf(f, "      \"experience\": %d,\n", surgeons[i].experience);
        
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
        fprintf(f, "      \"position\": \"%s\",\n", nurses[i].position);
        fprintf(f, "      \"specialization\": \"%s\",\n", nurses[i].specialization);
        fprintf(f, "      \"experience\": %d,\n", nurses[i].experience);
        fprintf(f, "      \"worked_hours\": %d,\n", nurses[i].worked_hours);
        fprintf(f, "      \"salary\": %.2f\n", calculate_salary(nurses[i].worked_hours, nurses[i].rate, 0));
        fprintf(f, "    }%s\n", (i == num_nurses - 1) ? "" : ",");
    }
    fprintf(f, "  ],\n");

    fprintf(f, "  \"ots\": [\n");
    for (int i = 0; i < num_ots; i++) {
        fprintf(f, "    {\n");
        fprintf(f, "      \"id\": %d,\n", ots[i].id);
        fprintf(f, "      \"name\": \"%s\",\n", ots[i].name);
        fprintf(f, "      \"type\": \"%s\",\n", ots[i].type);
        fprintf(f, "      \"equipment\": \"%s\",\n", ots[i].equipment);
        fprintf(f, "      \"is_available\": %s\n", ots[i].is_available ? "true" : "false");
        fprintf(f, "    }%s\n", (i == num_ots - 1) ? "" : ",");
    }
    fprintf(f, "  ],\n");

    fprintf(f, "  \"preference_order\": [\n");
    for (int i = 0; i < num_surgeries; i++) {
        fprintf(f, "    {\n");
        fprintf(f, "      \"patient\": %d,\n", surgeries[i].patient_id);
        fprintf(f, "      \"type\": \"%s\",\n", surgeries[i].urgency[0] ? surgeries[i].urgency : "Minor");
        fprintf(f, "      \"score\": %.2f,\n", surgeries[i].priority_score);
        fprintf(f, "      \"reason\": \"%s\"\n", surgeries[i].reason);
        fprintf(f, "    }%s\n", (i == num_surgeries - 1) ? "" : ",");
    }
    fprintf(f, "  ]\n");

    fprintf(f, "}\n");
    fclose(f);
}
