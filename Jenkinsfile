pipeline {
    agent any

    environment {
        // Define global environment variables
        APP_IMAGE      = "nextorder-app"
        APP_TAG        = "latest"
        TEST_CONTAINER = "nextorder-test-run"
        PORT           = "3000"
        JWT_SECRET     = "jenkins-pipeline-super-secret-key"
        MONGO_URI      = "mongodb://mongo:27017/nextorder" // points to compose network
    }

    options {
        // Pre-configure run limits
        timeout(time: 1, unit: 'HOURS')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    tools {
        nodejs 'node20' // Links Jenkins tools to automatically add node and npm commands to shell path
    }

    stages {
        // ========================================================
        // Stage 1: Checkout Source Code
        // ========================================================
        stage('Checkout') {
            steps {
                echo 'Checking out source code from git repository...'
                checkout scm
            }
        }

        // ========================================================
        // Stage 2: Install Project Dependencies
        // ========================================================
        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies...'
                // Using Node.js tool from Jenkins global tool configuration
                // standard in Jenkins setups to use node/npm plugins
                script {
                    sh 'npm ci'
                }
            }
        }

        // ========================================================
        // Stage 3: Security & Code Audit
        // ========================================================
        stage('Security & Code Audit') {
            steps {
                echo 'Running vulnerability audit on npm dependencies...'
                script {
                    // We catch the exit code so that low-severity findings don't fail the build
                    catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                        sh 'npm audit --audit-level=high'
                    }
                }
            }
        }

        // ========================================================
        // Stage 4: Docker Container Build
        // ========================================================
        stage('Docker Build') {
            steps {
                echo "Building Docker image: ${APP_IMAGE}:${APP_TAG}..."
                sh "docker build -t ${APP_IMAGE}:${APP_TAG} ."
            }
        }

        // ========================================================
        // Stage 5: Integration Testing (Verify Container Status)
        // ========================================================
        stage('Integration Testing & Verification') {
            steps {
                echo 'Starting Docker container in test mode...'
                script {
                    // Run the built container in background for health verification
                    sh "docker run -d -p 3000:3000 --name ${TEST_CONTAINER} -e PORT=3000 -e JWT_SECRET=${JWT_SECRET} -e MONGO_URI=mongodb://localhost:27017/nextorder-test ${APP_IMAGE}:${APP_TAG}"
                    
                    // Wait for container to initialize
                    echo 'Waiting 5 seconds for application to warm up...'
                    sleep time: 5, unit: 'SECONDS'
                    
                    // Ping health endpoint to verify startup success
                    try {
                        echo 'Querying /health endpoint...'
                        // Use curl to check status. Expect 200 HTTP code.
                        sh 'curl -f http://localhost:3000/health'
                        echo '✅ Integration testing SUCCESS: /health endpoint is operational!'
                    } catch (Exception e) {
                        error "❌ Health check failed. The container is unhealthy or did not start correctly."
                    } finally {
                        // Clean up testing container always
                        echo 'Cleaning up testing container...'
                        sh "docker stop ${TEST_CONTAINER} || true"
                        sh "docker rm ${TEST_CONTAINER} || true"
                    }
                }
            }
        }

        // ========================================================
        // Stage 6: Deployment (Docker Compose Orchestration)
        // ========================================================
        stage('Deploy Services') {
            steps {
                echo 'Orchestrating production-grade environment via Docker Compose...'
                // Using docker-compose to launch the app and mongo services together
                sh 'docker-compose down'
                sh 'docker-compose up -d --build'
                echo '🚀 NextOrder is now live and running in Dockerized production!'
            }
        }
    }

    // ========================================================
    // Post-Pipeline Actions & Notifications
    // ========================================================
    post {
        always {
            echo 'Pipeline execution complete.'
        }
        success {
            echo '🎉 Jenkins build completed successfully! Services are healthy and deployed.'
        }
        failure {
            echo '❌ Jenkins build failed. Inspect logs for details.'
        }
        cleanup {
            echo 'Pruning dangling Docker resources...'
            // Clean up unused docker objects to save disk space on Jenkins node
            sh 'docker image prune -f || true'
        }
    }
}
