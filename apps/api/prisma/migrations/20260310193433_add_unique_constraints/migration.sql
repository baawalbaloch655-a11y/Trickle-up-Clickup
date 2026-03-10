/*
  Warnings:

  - A unique constraint covering the columns `[orgId,name]` on the table `departments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[departmentId,name]` on the table `teams` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "departments_orgId_name_key" ON "departments"("orgId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_departmentId_name_key" ON "teams"("departmentId", "name");
