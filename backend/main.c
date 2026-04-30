#include <stdio.h>
#include <stdlib.h>
#include "hospital.h"

// Global data definitions
Surgery surgeries[MAX];
int num_surgeries = 0;

OT ots[MAX];
int num_ots = 0;

Surgeon surgeons[MAX];
int num_surgeons = 0;

Nurse nurses[MAX];
int num_nurses = 0;

int main() {
    printf("Starting Hospital Backend Engine...\n");
    
    // Read input data
    read_input();
    
    // Generate schedule
    generate_schedule(surgeries, num_surgeries, ots, num_ots);
    
    // Calculate payroll
    for (int i = 0; i < num_surgeons; i++) {
        calculate_salary(surgeons[i].worked_hours, surgeons[i].rate, 0); 
    }
    for (int i = 0; i < num_nurses; i++) {
        calculate_salary(nurses[i].worked_hours, nurses[i].rate, 0);
    }
    
    // Output JSON for frontend
    export_json();
    
    printf("Backend Engine completed successfully. output.json generated.\n");
    return 0;
}
