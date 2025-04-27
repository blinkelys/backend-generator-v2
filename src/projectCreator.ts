import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface Answers {
  projectName: string;
  language: "JavaScript" | "TypeScript";
  includeCors: boolean;
  database: "None" | "MongoDB" | "PostgreSQL";
}

export async function createProject(answers: Answers) {
  const { projectName, language, includeCors, database } = answers;

  const projectPath = path.join(process.cwd(), projectName);
  if (fs.existsSync(projectPath)) {
    console.error("Folder already exists. Please choose a different project name.");
    process.exit(1);
  }

  fs.mkdirSync(projectPath);

  const templatePath = path.join(__dirname, "..", "templates", language);
  copyFolder(templatePath, projectPath);

  // Prepare a list of dependencies to install
  const dependencies: string[] = ["express"];  // Always include express
  const devDependencies: string[] = [];

  // Add TypeScript specific dev dependencies
  if (language === "TypeScript") {
    devDependencies.push("typescript");
    devDependencies.push("@types/node");
    devDependencies.push("@types/express");  // Include TypeScript types for express
  }

  // Add CORS if selected
  if (includeCors) {
    const corsConfig = `
// CORS Config
import cors from 'cors';
app.use(cors());
    `;
    // Append CORS configuration
    appendToAppFile(projectPath, language, corsConfig);
    dependencies.push("cors");
    if (language === "TypeScript") {
      devDependencies.push("@types/cors");
    }
  }

  // Add database config if selected
  if (database !== "None") {
    let dbConfig = '';
    
    if (database === "MongoDB") {
      dbConfig = `
// Database connection
import mongoose from 'mongoose';
mongoose.connect('your_connection_string_here');
      `;
      dependencies.push("mongoose");
      if (language === "TypeScript") {
        devDependencies.push("@types/mongoose");
      }
    } else if (database === "PostgreSQL") {
      dbConfig = `
// Database connection
import { Pool } from 'pg';
const pool = new Pool({
  user: 'your_user',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
});
      `;
      dependencies.push("pg");
      if (language === "TypeScript") {
        devDependencies.push("@types/pg");
      }
    }
    
    appendToAppFile(projectPath, language, dbConfig);
  }

  // Append the app.listen code at the end of the file
  const listenCode = `
// Start the server
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
  `;
  appendToAppFile(projectPath, language, listenCode);

  // If we have dependencies to add, update package.json
  if (dependencies.length > 0 || devDependencies.length > 0) {
    const packageJsonPath = path.join(projectPath, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }

    dependencies.forEach(dep => {
      if (!packageJson.dependencies[dep]) {
        packageJson.dependencies[dep] = "latest"; // You can define a specific version if needed
      }
    });

    devDependencies.forEach(dep => {
      if (!packageJson.devDependencies[dep]) {
        packageJson.devDependencies[dep] = "latest";
      }
    });

    // Write updated package.json back to disk
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  console.log("Dependencies to be installed:", dependencies.join(", "));
  if (devDependencies.length > 0) {
    console.log("Dev dependencies to be installed:", devDependencies.join(", "));
  }
  console.log("Installing dependencies...");
  execSync("npm install", { cwd: projectPath, stdio: "inherit" });

  console.log("Project generated successfully!");
}

function copyFolder(src: string, dest: string) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest);

  fs.readdirSync(src).forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolder(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Function to append code at the end of app.js or app.ts
function appendToAppFile(projectPath: string, language: "JavaScript" | "TypeScript", code: string) {
  const appFilePath = path.join(projectPath, "src", `app.${language === "TypeScript" ? "ts" : "js"}`);

  // Check if file exists
  if (fs.existsSync(appFilePath)) {
    fs.appendFileSync(appFilePath, "\n" + code);
  } else {
    console.error(`App file not found at ${appFilePath}`);
    process.exit(1);
  }
}
