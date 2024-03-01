# XLS Transcoder

The API converts XLS files to XLSX or JSON on the fly.

## Why?

Some old systems, such as the [Course Catalog of NTNU](https://courseap2.itc.ntnu.edu.tw/acadmOpenCourse/index.jsp) (the university I'm studying at), still export XLS files. However, these legacy files lack good support libraries in many modern languages like Golang.

By using this service, I can easily convert XLS files to XLSX or JSON formats and process them effortlessly.

```go
import (
    "net/http"
)

func main() {
    resp, err := http.Post(
        "https://xls-transcoder.jacob.workers.dev/json/courses.json?from=https://courseap2.itc.ntnu.edu.tw/acadmOpenCourse/CofopdlByAcadmRpt",
        "application/x-www-form-urlencoded",
        strings.NewReader("rpt=cofopdl&acadmYear=112&acadmTerm=2&language1=chinese&serial_number=2668&download=xls")
    )
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    // Process the JSON response
    // ...
}
```

## Usage

```bash
# XLS to XLSX
curl 'https://xls-transcoder.jacob.workers.dev/xlsx/my-filename.xlsx?from=<url>'

# XLS to JSON
curl 'https://xls-transcoder.jacob.workers.dev/json/my-filename.json?from=<url>'
```

### Advanced Usage

Not only GET requests are supported, you can also use POST or other methods if needed.

```bash
curl -X POST -d 'action=download&file=test.xls' 'https://xls-transcoder.jacob.workers.dev/json/test.json?from=https://example.com/run-action'
```

## Deployment

You can use [Cloudflare Workers](https://workers.cloudflare.com/) to deploy your own instance of this service:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/JacobLinCool/xls-transcoder)

Also, a [Docker image](https://hub.docker.com/r/jacoblincool/xls-transcoder) is available for deploying on your own server:

```bash
docker run -p 8080:8080 jacoblincool/xls-transcoder
```

See [docker-compose.yml](./docker-compose.yml) for an example of using the Docker image.
