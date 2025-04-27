#!/usr/bin/env node
import inquirer from "inquirer";
import chalk from "chalk";
import { execSync } from "child_process";
import { createProject } from "./projectCreator";
async function main() {
  console.log(chalk.green("Welcome to Express Project Generator 🚀"));

  const answers = await inquirer.prompt([
    { type: "input", name: "projectName", message: "Project name:" },
    { type: "list", name: "language", message: "Language:", choices: ["JavaScript", "TypeScript"] },
    { type: "confirm", name: "includeCors", message: "Include CORS configuration?" },
    { type: "list", name: "database", message: "Database:", choices: ["None", "MongoDB", "PostgreSQL"] },
  ]);

  await createProject(answers);
}

main();
