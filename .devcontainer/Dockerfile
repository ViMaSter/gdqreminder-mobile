ARG VARIANT="18-bullseye"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

RUN wget https://github.com/errata-ai/vale/releases/download/v2.24.0/vale_2.24.0_Linux_64-bit.tar.gz && \ 
    tar -xvzf vale_2.24.0_Linux_64-bit.tar.gz -C bin