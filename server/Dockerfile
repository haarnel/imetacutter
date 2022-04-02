FROM python:3.9-alpine
RUN apk --update --no-cache add gcc musl-dev exiftool
WORKDIR /src
COPY requirements.txt /src/
RUN pip install -r requirements.txt
COPY server.py /src/
ENV PYTHONUNBUFFERED=1
CMD [ "python", "server.py" ]