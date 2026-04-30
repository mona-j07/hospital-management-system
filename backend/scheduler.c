#include <stdio.h>
#include "hospital.h"

void sort_surgeries_by_priority(Surgery s[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (s[j].priority > s[j + 1].priority) {
                Surgery temp = s[j];
                s[j] = s[j + 1];
                s[j + 1] = temp;
            }
        }
    }
}

int is_conflict(Surgery s, int ot_id, int start_slot) {
    int needed = slots_needed(s.duration);
    if (start_slot + needed > MAX_SLOTS) return 1;

    for (int i = 0; i < needed; i++) {
        if (ots[ot_id].schedule[start_slot + i] == 1) return 1;
    }

    int surg_idx = -1;
    for (int i = 0; i < num_surgeons; i++) {
        if (surgeons[i].id == s.surgeon_id) { surg_idx = i; break; }
    }
    if (surg_idx != -1) {
        for (int i = 0; i < needed; i++) {
            if (surgeons[surg_idx].schedule[start_slot + i] == 1) return 1;
        }
    }
    return 0;
}

void generate_schedule(Surgery s[], int n, OT ot[], int m) {
    sort_surgeries_by_priority(s, n);

    for (int i = 0; i < n; i++) {
        if (s[i].assigned_ot != -1) continue; 
        
        int needed = slots_needed(s[i].duration);
        int scheduled = 0;

        for (int slot = 0; slot <= MAX_SLOTS - needed && !scheduled; slot++) {
            for (int j = 0; j < m; j++) {
                if (!is_conflict(s[i], j, slot)) {
                    s[i].assigned_ot = ot[j].id;
                    s[i].start_slot = slot;
                    s[i].end_slot = slot + needed;
                    
                    for (int k = 0; k < needed; k++) ot[j].schedule[slot + k] = 1;

                    for (int x = 0; x < num_surgeons; x++) {
                        if (surgeons[x].id == s[i].surgeon_id) {
                            for (int k = 0; k < needed; k++) surgeons[x].schedule[slot + k] = 1;
                            surgeons[x].worked_hours += needed / 2; // Rough estimate (2 slots = 1 hr)
                            break;
                        }
                    }
                    scheduled = 1;
                    break;
                }
            }
        }
    }
}
