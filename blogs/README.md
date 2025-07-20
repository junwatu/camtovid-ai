# Generate Fun Video From Camera Shoot using Kling AI

![cover](images/cover.png)

## What This Blog is About

Capturing a beautiful moment or any object in the  real life that you like from a camera and using AI to transform it into fun, stylized clips is a great way to engage users and showcase creative technology. In this guide, we build a developer-friendly pipeline using Next.js for the frontend, Fal.ai as a serverless inference runtime, Kling AI for video generation, and GridDB Cloud for real-time metadata storage. We’ll walk through how to capture frames from the webcam, send them to Kling for enhancement, log metadata (image URL, applied effects which is a prompt, ant generated video URL.) to GridDB, and render the final video.


## Prerequisites

### Node.js

This project is built using Next.js, which requires Node.js version 16 or higher. You can download and install Node.js from [https://nodejs.org/en](https://nodejs.org/en).

### GridDB

#### Sign Up for GridDB Cloud Free Plan

If you would like to sign up for a GridDB Cloud Free instance, you can do so at the following link: [https://form.ict-toshiba.jp/download_form_griddb_cloud_freeplan_e](https://form.ict-toshiba.jp/download_form_griddb_cloud_freeplan_e).

After successfully signing up, you will receive a free instance along with the necessary details to access the GridDB Cloud Management GUI, including the **GridDB Cloud Portal URL**, **Contract ID**, **Login**, and **Password**.

#### GridDB WebAPI URL

Go to the GridDB Cloud Portal and copy the WebAPI URL from the **Clusters** section. It should look like this:

![GridDB Portal](images/griddb-cloud-portal.png)

#### GridDB Username and Password

Go to the **GridDB Users** section of the GridDB Cloud portal and create or copy the username for `GRIDDB_USERNAME`. The password is set when the user is created for the first time, use this as the `GRIDDB_PASSWORD`.

![GridDB Users](images/griddb-cloud-users.png)

For more details, to get started with GridDB Cloud, please follow this [quick start guide](https://griddb.net/en/blog/griddb-cloud-quick-start-guide/).

#### IP Whitelist

When running this project, please ensure that the IP address where the project is running is whitelisted. Failure to do so will result in a 403 status code or forbidden access.

You can use a website like [What Is My IP Address](https://whatismyipaddress.com/) to find your public IP address.

To whitelist the IP, go to the GridDB Cloud Admin and navigate to the **Network Access** menu.

![ip whitelist](images/ip-whitelist.png)


### Fal Kling 2.1 API

You need an Kling 2.1 API key to use this project. You can sign up for an account at [fal.ai](https://fal.ai).

After signing up, go to the **Account** section, and create and copy your API key.

![Kling 2.1 API Key](images/fal-imagen-api-key.png)


Kling 2.1 is the latest version of Kling AI’s text/image-to-video generation engine, released in May 2025 by Kuaishou (also known as Kwai). It's a significant upgrade from Kling 1.6 and 2.0, bringing smoother motion, sharper visuals, stronger prompt adherence, faster speeds, and better cost efficiency.


## How to Run

### 1. Clone the repository

Clone the repository from [https://github.com/junwatu/camtovid-ai](https://github.com/junwatu/camtovid-ai) to your local machine.

```sh
git clone https://github.com/junwatu/camtovid-ai
cd camtovid-ai
cd apps
```

### 2. Install dependencies

Install all project dependencies using npm.

```sh
npm install
```

### 3. Set up environment variables

Copy file `.env.example` to `.env` and fill in the values:

```ini
# Copy this file to .env.local and add your actual API keys
# Never commit .env.local to version control

# Fal.ai API Key for Kling 2.1
# Get your key from: https://fal.ai/dashboard
FAL_KEY=


GRIDDB_WEBAPI_URL=
GRIDDB_PASSWORD=
GRIDDB_USERNAME=
```

Please look the section on [Prerequisites](#prerequisites) before running the project.

### 4. Run the project

Run the project using the following command:

```sh
npm run dev
```

### 5. Open the application

Open the application in your browser at [http://localhost:3000](http://localhost:3000). You also need to allow the browser to access your camera. If you access the web application from mobile device there will option to select between rear and back camera.

## Architecture

![arc](images/arch.png)

The architecture and user flow are intentionally simple for rapid development and ease of use. Users access the app from any desktop or mobile browser. After capturing an image with their device’s camera, they enter a prompt describing the video they want to generate.

The Next.js frontend sends both the image and prompt to Fal AI’s Kling 2.1 model. Kling 2.1 processes these inputs, generates a video, and returns it directly to the browser client.

When generation is done the metadata: image URL, prompt, and generated video URL will be saved to the GridDB Cloud.


## Technical Overview

### Camera Captures

### 