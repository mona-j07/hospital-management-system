#ifndef HOSPITAL_H
#define HOSPITAL_H

#define MAX 100
#define MAX_SLOTS 48

typedef struct {
    int id;
    char type[50];
    char urgency[20]; // Emergency, Major, Minor
    int patient_id;
    int surgeon_id;
    int required_nurses;
    int duration; // in minutes
    char equipment[255];
    int priority; // Base priority input
    float priority_score; // Calculated priority score
    char reason[100]; // Reason for priority
    int assigned_ot;
    int assigned_nurses[10];
    int num_assigned_nurses;
    int start_slot; // 0 to MAX_SLOTS - 1 (assume 30 min slots, 0 = 00:00)
    int end_slot;
    char date[11]; // YYYY-MM-DD
} Surgery;

typedef struct {
    int id;
    char name[50];
    char type[50];
    char equipment[255];
    int is_available;
    int schedule[MAX_SLOTS]; // 0 = free, 1 = booked
} OT;

typedef struct {
    int id;
    char name[50];
    char position[50];
    char specialization[50];
    int experience;
    int max_hours;
    int worked_hours;
    float rate;
    int schedule[MAX_SLOTS]; // Track surgeon's booked slots
} Surgeon;

typedef struct {
    int id;
    char name[50];
    char position[50];
    char specialization[50];
    int experience;
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
float calculate_salary(int experience, int total_minutes, int surgeries, int isDoctor);

void export_json();
int slots_needed(int duration_minutes);

void init_mock_data();

#endif
