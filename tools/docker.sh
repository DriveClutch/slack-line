#!/bin/bash

REGISTRY_HOSTNAME="458132236648.dkr.ecr.us-east-1.amazonaws.com"

function setup_ecr_repo() {
  L_PRJ_NAME=$1
  L_REPOSITORY_NAME=$2

  POLICY_FILENAME="ecrpolicy.json"
  export AWS_DEFAULT_REGION="us-east-1"

  cat <<EOM > ${POLICY_FILENAME}
{
  "Version": "2008-10-17",
  "Statement": [
    {
      "Sid": "newaccounts",
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "arn:aws:iam::473953882568:root",
          "arn:aws:iam::882831108660:root",
          "arn:aws:iam::543661694755:root",
          "arn:aws:iam::790280700559:root",
          "arn:aws:iam::693451398936:root",
          "arn:aws:iam::183927706744:root"
        ]
      },
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability"
      ]
    }
  ]
}
EOM

  echo "${L_PRJ_NAME} Checking for ECR repo ${L_REPOSITORY_NAME}"
  aws ecr describe-repositories --repository-name ${L_REPOSITORY_NAME}
  if [ "$?" != "0" ]; then
    echo "${L_PRJ_NAME} Did not find repo, creating ${L_REPOSITORY_NAME}"
    aws ecr create-repository --repository-name ${L_REPOSITORY_NAME}
  fi
  echo "${L_PRJ_NAME} Setting repo policy"
  aws ecr set-repository-policy --repository-name ${L_REPOSITORY_NAME} --policy-text file://${POLICY_FILENAME}
}

function docker_build_tag_push() {
  L_PRJ_NAME=$1
  L_BUILD_DIR=$2
  L_IMAGE_NAME_GITHASH=$3
  L_IMAGE_NAME_LATEST=$4


  echo "${L_PRJ_NAME} Building docker image"
  docker build -t ${L_IMAGE_NAME_GITHASH} -t ${L_IMAGE_NAME_LATEST} ${L_BUILD_DIR}

  echo "Pushing ${L_IMAGE_NAME_GITHASH} to ECR"
  docker push ${L_IMAGE_NAME_GITHASH}
  echo "Pushing ${L_IMAGE_NAME_LATEST} to ECR"
  docker push ${L_IMAGE_NAME_LATEST}
}

eval $(aws ecr get-login --region us-east-1)

if [ -f "Dockerfile" ]; then
  PRJ_NAME="$(basename ${PWD})"
  REPOSITORY_NAME="${CIRCLE_BRANCH:-master}/${PRJ_NAME}"
  IMAGE_NAME_LATEST="${REGISTRY_HOSTNAME}/${REPOSITORY_NAME}:latest"
  IMAGE_NAME_GITHASH="${REGISTRY_HOSTNAME}/${REPOSITORY_NAME}:${CIRCLE_SHA1}"

  setup_ecr_repo ${PRJ_NAME} ${REPOSITORY_NAME}
  docker_build_tag_push ${PRJ_NAME} . ${IMAGE_NAME_GITHASH} ${IMAGE_NAME_LATEST}
else
  for prj in */Dockerfile
  do
    PRJ_NAME="$(dirname ${prj})"
    REPOSITORY_NAME="${CIRCLE_BRANCH:-master}/${PRJ_NAME}"
    IMAGE_NAME_LATEST="${REGISTRY_HOSTNAME}/${REPOSITORY_NAME}:latest"
    IMAGE_NAME_GITHASH="${REGISTRY_HOSTNAME}/${REPOSITORY_NAME}:${CIRCLE_SHA1}"

    setup_ecr_repo ${PRJ_NAME} ${REPOSITORY_NAME}
    docker_build_tag_push ${PRJ_NAME} "${PRJ_NAME}/" ${IMAGE_NAME_GITHASH} ${IMAGE_NAME_LATEST}
  done
fi
