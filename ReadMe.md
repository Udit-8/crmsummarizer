- I know basic coding like loops and if else statement but do not know the complexities of development so explain every code that you generate.

---

## Running the Project with Docker

These instructions will help you build and run the CRM Summarizer project using Docker and Docker Compose. This is useful for running all services and dependencies in isolated containers, making setup easier and more consistent.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your machine.

### Steps

1. **Build and Start the Services**
   
   In your project root directory, run:
   
   ```sh
   docker compose up --build
   ```
   - This command builds the Docker images for all services and starts them.
   - The `--build` flag ensures any changes to the code are included in the images.

2. **Accessing the Services**
   - By default, the main API service will be available at [http://localhost:3000](http://localhost:3000) (if you used the sample setup).
   - You can change the port in the `docker-compose.yml` file if needed.

3. **Stopping the Services**
   
   To stop all running containers, press `Ctrl+C` in the terminal where Docker is running, then run:
   
   ```sh
   docker compose down
   ```

### Notes
- If you add new services or dependencies, update the `docker-compose.yml` file accordingly.
- For development, you can edit code in your local folders and restart the containers to see changes.
- If you encounter issues, make sure Docker Desktop is running and up to date.

---