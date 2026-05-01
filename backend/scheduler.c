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

int is_ot_free(int ot_id, int start, int needed, const char* date, Surgery s[], int n) {
    for (int i = 0; i < n; i++) {
        if (s[i].assigned_ot == ot_id && strcmp(s[i].date, date) == 0) {
            if (start < s[i].end_slot && (start + needed) > s[i].start_slot) return 0;
        }
    }
    return 1;
}

int is_surgeon_free(int surg_id, int start, int needed, const char* date, Surgery s[], int n) {
    for (int i = 0; i < n; i++) {
        if (s[i].surgeon_id == surg_id && strcmp(s[i].date, date) == 0) {
            if (start < s[i].end_slot && (start + needed) > s[i].start_slot) return 0;
        }
    }
    return 1;
}

int is_nurse_free(int nurse_id, int start, int needed, const char* date, Surgery s[], int n) {
    for (int i = 0; i < n; i++) {
        if (strcmp(s[i].date, date) == 0) {
            for (int k = 0; k < s[i].num_assigned_nurses; k++) {
                if (s[i].assigned_nurses[k] == nurse_id) {
                    if (start < s[i].end_slot && (start + needed) > s[i].start_slot) return 0;
                }
            }
        }
    }
    return 1;
}

void generate_schedule(Surgery s[], int n, OT ot[], int m) {
    sort_surgeries_by_priority(s, n);

    for (int i = 0; i < n; i++) {
        int needed = slots_needed(s[i].duration);
        int scheduled = 0;
        
        // If manual slot is provided, try to honor it.
        int start_search = (s[i].start_slot != -1) ? s[i].start_slot : 0;
        int end_search = (s[i].start_slot != -1) ? s[i].start_slot : (MAX_SLOTS - needed);

        for (int slot = start_search; slot <= end_search && !scheduled; slot++) {
            for (int j = 0; j < m; j++) {
                if (ot[j].is_available && is_ot_free(ot[j].id, slot, needed, s[i].date, s, i)) {
                    // Find surgeon
                    int found_surg = -1;
                    for (int x = 0; x < num_surgeons; x++) {
                        if (is_surgeon_free(surgeons[x].id, slot, needed, s[i].date, s, i)) {
                            found_surg = x;
                            break;
                        }
                    }

                    // Find nurses
                    int found_nurses[10];
                    int n_count = 0;
                    for (int y = 0; y < num_nurses && n_count < s[i].required_nurses; y++) {
                        if (is_nurse_free(nurses[y].id, slot, needed, s[i].date, s, i)) {
                            found_nurses[n_count++] = y;
                        }
                    }

                    if (found_surg != -1 && n_count == s[i].required_nurses) {
                        s[i].assigned_ot = ot[j].id;
                        s[i].start_slot = slot;
                        s[i].end_slot = slot + needed;
                        s[i].surgeon_id = surgeons[found_surg].id;
                        s[i].num_assigned_nurses = n_count;
                        for (int k = 0; k < n_count; k++) {
                            s[i].assigned_nurses[k] = nurses[found_nurses[k]].id;
                        }
                        scheduled = 1;
                        break;
                    }
                }
            }
        }
    }
}
