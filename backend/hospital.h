#ifndef HOSPITAL_H
#define HOSPITAL_H

#define MAX 100
#define MAX_SLOTS 48

typedef struct {
    int id;
    char type[50];
    int patient_id;
    int surgeon_id;
    int required_nurses;
    int duration; // in minutes
    char equipment[50];
    int priority; // 1 = highest
    int assigned_ot;
    int assigned_nurses[10];
    int num_assigned_nurses;
    int start_slot; // 0 to MAX_SLOTS - 1 (assume 30 min slots, 0 = 00:00)
    int end_slot;
} Surgery;

typedef struct {
    int id;
    char equipment[50];
    int is_available;
    int schedule[MAX_SLOTS]; // 0 = free, 1 = booked
} OT;

typedef struct {
    int id;
    char name[50];
    char specialization[50];
    int max_hours;
    int worked_hours;
    float rate;
    int schedule[MAX_SLOTS]; // Track surgeon's booked slots
} Surgeon;

typedef struct {
    int id;
    char name[50];
    char specialization[50];
    int max_hours;
    int worked_hours;
    float rate;
    int schedule[MAX_SLOTS];
} Nurse;

// Global Data
extern Surgery surgeries[MAX];
extern int num_surgeries;

extern OT ots[MAX];
extern int num_ots;

extern Surgeon surgeons[MAX];
extern int num_surgeons;

extern Nurse nurses[MAX];
extern int num_nurses;

// Function Prototypes
void read_input();
void generate_schedule(Surgery s[], int n, OT ot[], int m);
int is_conflict(Surgery s, int ot_id, int slot);
void insert_emergency(Surgery *s, int *n);
float calculate_salary(int hours, float rate, int overtime);
void export_json();
int slots_needed(int duration_minutes);

void init_mock_data();

#endif
