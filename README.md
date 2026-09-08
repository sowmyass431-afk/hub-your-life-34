# Student Hub Central

Build a complete, production-quality full-stack web application called Student Hub.

The purpose of Student Hub is to give a CSE college student one place to manage their entire college life: timetable, attendance, assignments, exams, reminders, notes, important links, and an AI study assistant.

IMPORTANT:

Build the actual functional application, not a static UI mockup.

All buttons, forms, navigation, calculations, CRUD operations, and data persistence must work.

Make the application responsive on desktop, tablet, and mobile.

Use a clean modern SaaS/productivity-app design.

Do not leave placeholder buttons or fake functionality.

Test the application after implementation and fix errors.

1. DASHBOARD

Create a beautiful dashboard containing:

Today's date

Greeting

Today's classes

Next upcoming class

Weekly timetable shortcut

Overall attendance

Subjects with low attendance

Pending assignments

Overdue assignments

Upcoming exams

Upcoming reminders

Important links

AI assistant shortcut

The dashboard should update automatically from the user's stored data.

2. TIMETABLE

Create a complete timetable system.

Users can:

Add subject

Edit subject

Delete subject

Add teacher

Add classroom

Select day

Select start time

Select end time

View daily timetable

View weekly timetable

Mark a class as completed

See the next upcoming class

Highlight the current class

Create a clean weekly timetable UI.

3. ATTENDANCE TRACKER

For every subject store:

Subject name

Total classes

Attended classes

Missed classes

Attendance percentage

Automatically calculate:

attendance percentage = attended classes / total classes × 100

Attendance status:

Below 75% → Critical

75%–80% → Warning

Above 80% → Safe

Also calculate:

How many classes the student can miss while remaining at or above 75%.

How many consecutive classes the student needs to attend to reach a selected target percentage such as 80%.

What attendance percentage they will have after attending the next class.

What happens if they miss the next class.

Display attendance using attractive progress bars and charts.

4. ASSIGNMENTS

Create an assignment/task manager.

Fields:

Title

Subject

Description

Due date

Priority

Status

Priority:

Low

Medium

High

Status:

Pending

In Progress

Completed

Features:

Add

Edit

Delete

Mark complete

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hub-your-life-34.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/13c720a5-e06e-4f7b-862f-ce9a6c136fa2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
