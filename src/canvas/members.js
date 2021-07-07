"use strict";

import { getEnrollmentsInCourse, getOptions } from "node-canvas-api";

export const getMembers = async (courseId) => {
  const rawStudents = await getEnrollmentsInCourse(
    courseId,
    getOptions.users.enrollmentType.student
  );

  const rawStaff = await getEnrollmentsInCourse(
    courseId,
    getOptions.users.enrollmentType.teacher,
    getOptions.users.enrollmentType.ta
  );

  // filtering here because the current API doesn't always correctly filter....
  const staff = rawStaff.filter(
    (val) =>
      val["type"] === "TaEnrollment" || val["type"] === "TeacherEnrollment"
  );
  const students = rawStudents.filter(
    (val) => val["type"] === "StudentEnrollment"
  );

  return { staff, students };
};
