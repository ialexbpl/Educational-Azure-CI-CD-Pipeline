pipeline {
  agent any

  parameters {
    choice(name: 'TARGET_ENV', choices: ['dev', 'prod'], description: 'AKS namespace: dev or prod')
  }

  environment {
    ACR_NAME           = 'statmasteracrab'
    ACR_LOGIN_SERVER   = 'statmasteracrab.azurecr.io'
    IMAGE_NAME         = 'statmaster-web'
    AKS_RESOURCE_GROUP = 'rg-statmaster'
    AKS_NAME           = 'aks-statmaster'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Azure login') {
      steps {
        withCredentials([
          string(credentialsId: 'AZURE_CLIENT_ID',       variable: 'AZURE_CLIENT_ID'),
          string(credentialsId: 'AZURE_CLIENT_SECRET',   variable: 'AZURE_CLIENT_SECRET'),
          string(credentialsId: 'AZURE_TENANT_ID',       variable: 'AZURE_TENANT_ID'),
          string(credentialsId: 'AZURE_SUBSCRIPTION_ID', variable: 'AZURE_SUBSCRIPTION_ID')
        ]) {
          sh '''
            az login --service-principal \
              -u "$AZURE_CLIENT_ID" \
              -p "$AZURE_CLIENT_SECRET" \
              --tenant "$AZURE_TENANT_ID"
            az account set --subscription "$AZURE_SUBSCRIPTION_ID"
          '''
        }
      }
    }

    stage('Build and push') {
      steps {
        script {
          def tag = env.GIT_COMMIT ? env.GIT_COMMIT.take(7) : "manual${env.BUILD_NUMBER}"
          env.IMAGE = "${env.ACR_LOGIN_SERVER}/${env.IMAGE_NAME}:${tag}"
        }
        withCredentials([
          string(credentialsId: 'AZURE_CLIENT_ID',       variable: 'AZURE_CLIENT_ID'),
          string(credentialsId: 'AZURE_CLIENT_SECRET',   variable: 'AZURE_CLIENT_SECRET'),
          string(credentialsId: 'AZURE_TENANT_ID',       variable: 'AZURE_TENANT_ID'),
          string(credentialsId: 'AZURE_SUBSCRIPTION_ID', variable: 'AZURE_SUBSCRIPTION_ID')
        ]) {
          sh '''
            az login --service-principal \
              -u "$AZURE_CLIENT_ID" \
              -p "$AZURE_CLIENT_SECRET" \
              --tenant "$AZURE_TENANT_ID"
            az account set --subscription "$AZURE_SUBSCRIPTION_ID"
            az acr login --name "$ACR_NAME"
            docker build -t "$IMAGE" .
            docker push "$IMAGE"
          '''
        }
      }
    }

    stage('Deploy to AKS') {
      steps {
        script {
          env.NAMESPACE = (params.TARGET_ENV == 'prod') ? 'statmaster-prod' : 'statmaster-dev'
        }
        sh '''
          az aks get-credentials \
            --resource-group "$AKS_RESOURCE_GROUP" \
            --name "$AKS_NAME" \
            --overwrite-existing
          sed "s|IMAGE_TO_REPLACE|${IMAGE}|g" k8s/deployment.yaml \
            | kubectl apply -n "$NAMESPACE" -f -
          kubectl apply -n "$NAMESPACE" -f k8s/service.yaml
          kubectl rollout status deployment/statmaster-web -n "$NAMESPACE" --timeout=180s
          kubectl get svc statmaster-web -n "$NAMESPACE" -o wide
        '''
      }
    }
  }
}