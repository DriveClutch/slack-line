#!/bin/bash -e

ECR_HOSTNAME="458132236648.dkr.ecr.us-east-1.amazonaws.com"
export AWS_DEFAULT_REGION="us-east-1"

function setup_ecr_repo() {
  local app=$1
  local repo=$2

  local POLICY_FILENAME="ecrpolicy.json"

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

  echo "${app} Checking for ECR repo ${repo}"
  set +e # Turn off failure dumping
  aws ecr describe-repositories --repository-name ${repo}
  RET=$?
  set -e # Turn on failure dumping
  if [ "$RET" != "0" ]; then
    echo "${app} Did not find repo, creating ${repo}"
    aws ecr create-repository --repository-name ${repo}
  fi
  echo "${app} Setting repo policy"
  aws ecr set-repository-policy --repository-name ${repo} --policy-text file://${POLICY_FILENAME}
}

function docker_build_tag_push() {
  local app=$1
  local builddir=$2
  local hashedimagetag=$3
  local latestimagetag=$4

  echo "${app} Building docker image"
  docker build                               \
	  -t ${hashedimagetag}                   \
	  -t ${latestimagetag}                   \
	  ${builddir}

  echo "Pushing ${hashedimagetag} to ECR"
  docker push ${hashedimagetag}
  echo "Pushing ${latestimagetag} to ECR"
  docker push ${latestimagetag}
}

# Login to the ECR repo
eval $(aws ecr get-login)

# Look for all the Dockerfiles, exclude the vendor directory for Go projects and node_modules for NodeJS projects
for dockerfile in $(find . -not -path "./vendor/*" -not -path "./node_modules/*" -name Dockerfile)
do
	# Use the parent directory of the Dockerfile as the appname
	appname=$(basename $(dirname $dockerfile))
	# Set the relative path to the Dockerfile for building
	dockerdir=$(dirname $dockerfile)

	if [[ $appname == "." ]]; then
		# Dockerfile is at the repo root, update the appname to the name of the repo
		appname=$(basename $PWD)
	else
		# If the appname is not "." then it is not in the root of the repo, so add a slash to the dockerdir
		dockerdir="${dockerdir}/"
	fi

	# set the name of the ecr repo inside the registry
	ecrreponame="${CIRCLE_BRANCH:-master}/${appname}"
	# Set the fully qualified repo rul
	urlbase="${ECR_HOSTNAME}/${ecrreponame}"
	# Set the git hash of the build (NOTE: using localbuild for non CircleCI builds on purpose)
	buildhash=${CIRCLE_SHA1:-localbuild}

	# Make sure the repo exists and has the correct pull permissions for all the accounts
	setup_ecr_repo ${appname} ${ecrreponame}
	# Build the Docker and push it to ECR
	docker_build_tag_push ${appname} ${dockerdir} ${urlbase}:${buildhash} ${urlbase}:latest
done
