<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://github.com/AliSaleemHasan/NowHere-frontend/blob/master/assets/images/icon.png" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A Social Media APP Built with  <a href="http://nodejs.org" target="_blank">Nest JS</a> framework for knowing what's up to nearby.</p>
    <p align="center">

</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

This is a minimalistic Social Media Application that is meant to help people know what's happening nearby in real-time.
People can see what other posted (from their camera feeds) and know if there's something lost, or Hidden-Gim or some Promotion is happening NearBY.


## Project setup

##install dependencies
```bash
pnpm install
# for specific service
pnpm install --filter [service name]
```


## Local setup 
```bash
# development locally with docker
docker compose -f docker-compose.dev.yaml up
# start deployment like server
docker compose up
# if you prefer kubernetes locally (with kubectl )
kubectl create -f k8s/secrets
kubectl create -f k8s
```

**Please make sure to add the correct environment variables (Will be added to nest configuration later)**:


## Run tests

```bash

# for specific service (with docker compose on)
pnpm nx test snaps|storage|auth
# for all services
pnpm nx test
```

## Stay in touch

- Author - [Ali Hasan](https://www.linkedin.com/in/ali-saleem-hasan/)


