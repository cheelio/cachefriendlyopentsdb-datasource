## Grafana Cache-Friendly OpenTSDB Datasource

This is a fork of Grafana's default OpenTSDB datasource, with the following modifications:

- Start- and end-timestamps can be rounded up, to the nearest X milliseconds. You can configure this in the datasource settings.
- no-cache HTTP request headers can be removed to allow backend requests to be cached.
