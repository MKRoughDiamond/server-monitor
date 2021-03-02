from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import subprocess
import argparse
import os

QUERY_LIST = []
BLACK_LIST = []
TOKEN = None
dir_ = os.path.dirname(__file__)

class ServerMonitor(BaseHTTPRequestHandler):
    def _set_headers_success(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin','*')
        self.end_headers()


    def _set_headers_failed(self):
        self.send_response(400)
        self.send_header('Content-type', 'text/html')
        self.send_header('Access-Control-Allow-Origin','*')
        self.end_headers()
        self.wfile.write(bytes(json.dumps({'content':'Your request is invalid, so your IP is blocked. Please talk to administrator.'}),'utf-8'))
        self._add_blacklist()


    def _add_blacklist(self):
        if self.client_address[0] not in BLACK_LIST:
            BLACK_LIST.append(self.client_address[0])
            print('{} is added to black list'.format(self.client_address[0]))


    def do_GET(self):
        content_len = int(self.headers.get('content-length'))
        contents = self.rfile.read(content_len).decode('utf-8')
        try:
            dic = json.loads(contents)
            if self.client_address[0] in BLACK_LIST or dic['token']!=TOKEN or len(list(dic.keys())) != 1:
                raise Exception
            inst = ['nvidia-smi','--query-gpu='+','.join(QUERY_LIST),'--format=csv']
            out = (subprocess.check_output(inst)).decode('utf-8')
        except Exception:
            self._set_headers_failed()
            return
        self._set_headers_success()
        response = {
            'content': out
        }
        self.wfile.write(bytes(json.dumps(response),'utf-8'))
    

    def do_OPTIONS(self):
        self._add_blacklist()

    
    def do_POST(self):
        self._add_blacklist()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--ip', type=str, default=None)
    parser.add_argument('--port', type=int, default=None)
    args = parser.parse_args()

    with open(os.path.join(dir_,'../token'),'r') as f:
        for line in f:
            TOKEN = line[:-1]
            break

    with open(os.path.join(dir_,'query_list.config'),'r') as f:
        for line in f:
            QUERY_LIST.append(line[:-1])

    with open(os.path.join(dir_,'blacklist.list'), 'r') as f:
        for line in f:
            BLACK_LIST.append(line[:-1])

    if args.ip is not None and args.port is not None:
        webServer = HTTPServer((args.ip,args.port), ServerMonitor)
        try:
            webServer.serve_forever()
        except KeyboardInterrupt:
            pass
        webServer.server_close()
        with open(os.path.join(dir_,'blacklist.list'),'w') as f:
            for ip in BLACK_LIST:
                f.write(ip+'\n')
