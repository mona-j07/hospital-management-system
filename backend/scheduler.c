#include <stdio.h>
#include "hospital.h"

#include <string.h>

void calculate_priority(Surgery s[], int n) {
    for (int i = 0; i < n; i++) {
        float score = 0;
        if (strcmp(s[i].urgency, "Emergency") == 0 || s[i].priority == 1) {
            score += 100;
            strcpy(s[i].reason, "Critical case (Emergency)");
        } else if (strcmp(s[i].urgency, "Major") == 0 || s[i].priority == 2) {
            score += 50;
            strcpy(s[i].reason, "Major surgery");
        } else {
            score += 10;
            strcpy(s[i].reason, "Minor surgery, lower urgency");
        }

        // Short duration bonus (assuming max duration is around 300 mins)
        score += (300.0f - s[i].duration) / 10.0f;

        // Resource availability score (just a placeholder bonus)
        score += 5.0f; 

        s[i].priority_score = score;
    }
}

void sort_surgeries_by_priority(Surgery s[], int n) {
    calculate_priority(s, n);
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (s[j].priority_score < s[j + 1].priority_score) {
                Surgery temp = s[j];
                s[j] = s[j + 1];
                s[j + 1] = temp;
            }
        }
    }
}

int is_ot_available(int ot_idx, int start_slot, int needed) {
    if (!ots[ot_idx].is_available) return 0;
    if (start_slot + needed > MAX_SLOTS) return 0;
    for (int i = 0; i < needed; i++) {
        if (ots[ot_idx].schedule[start_slot + i] == 1) return 0;
    }
    return 1;
}

int is_surgeon_available(int surg_idx, int start_slot, int needed) {
    for (int i = 0; i < needed; i++) {
        if (surgeons[surg_idx].schedule[start_slot + i] == 1) return 0;
    }
    return 1;
}

int is_nurse_available(int nurse_idx, int start_slot, int needed) {
    for (int i = 0; i < needed; i++) {
        if (nurses[nurse_idx].schedule[start_slot + i] == 1) return 0;
    }
    return 1;
}

void generate_schedule(Surgery s[], int n, OT ot[], int m) {
    sort_surgeries_by_priority(s, n);

    for (int i = 0; i < n; i++) {
        s[i].assigned_ot = -1; // Reset assignment
        s[i].num_assigned_nurses = 0;
        
        int needed = slots_needed(s[i].duration);
        int scheduled = 0;

        for (int slot = 0; slot <= MAX_SLOTS - needed && !scheduled; slot++) {
            for (int j = 0; j < m; j++) {
                if (is_ot_available(j, slot, needed)) {
                    // Try to find a surgeon
                    int found_surgeon_idx = -1;
                    for (int x = 0; x < num_surgeons; x++) {
                        if (is_surgeon_available(x, slot, needed)) {
                            found_surgeon_idx = x;
                            break;
                        }
                    }

                    // Try to find enough nurses
                    int found_nurses[10];
                    int nurses_found = 0;
                    for (int y = 0; y < num_nurses && nurses_found < s[i].required_nurses; y++) {
                        if (is_nurse_available(y, slot, needed)) {
                            found_nurses[nurses_found++] = y;
                        }
                    }

                    if (found_surgeon_idx != -1 && nurses_found == s[i].required_nurses) {
                        // Allocate everything
                        s[i].assigned_ot = ot[j].id;
                        s[i].start_slot = slot;
                        s[i].end_slot = slot + needed;
                        s[i].surgeon_id = surgeons[found_surgeon_idx].id;
                        s[i].num_assigned_nurses = nurses_found;
                        
                        for (int k = 0; k < needed; k++) ot[j].schedule[slot + k] = 1;

                        for (int k = 0; k < needed; k++) surgeons[found_surgeon_idx].schedule[slot + k] = 1;
                        surgeons[found_surgeon_idx].worked_hours += needed / 2;

                        for (int k = 0; k < nurses_found; k++) {
                            int n_idx = found_nurses[k];
                            s[i].assigned_nurses[k] = nurses[n_idx].id;
                            for (int z = 0; z < needed; z++) nurses[n_idx].schedule[slot + z] = 1;
                            nurses[n_idx].worked_hours += needed / 2;
                        }

                        scheduled = 1;
                        break;
                    }
                }
            }
        }
    }
}
