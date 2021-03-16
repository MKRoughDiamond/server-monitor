from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import subprocess
import io
import sys
import json
import os
import argparse

NAME_DICT = {}
PAD_DICT = {}
TOKEN = None
dir_ = os.path.dirname(__file__)
SERVERS = []

class ServerMonitor(BaseHTTPRequestHandler):
    def _set_headers_success(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin','http://147.46.215.63:3000')
        self.end_headers()


    def parse_gpu_status(self,content):
        results = []
        lines = content.split('\n')
        col_names = lines[0].replace(' ','').split(',')
        for line in lines[1:]:
            if len(line) == 0:
                break
            d = [{NAME_DICT[name] : None} for name in col_names]
            t = line.split(', ')
            for i, name in enumerate(col_names):
                d[i][NAME_DICT[name]]=t[i]
            results.append(d)
        return results


    def parse_cpu_status(self,content):
        results = []
        lines = content.split('\n\n')[-1].split('\n')[:-1]
        l = list(map(lambda x : list(filter(None,x.split(' ')))[1:], lines))
        keys = l[0]
        values = l[1:]
        for value in values:
            t = []
            for i in range(len(keys)):
                t.append({keys[i]:value[i]})
            results.append(t)
        return results


    def parse_memory_status(self,content):
        results = []
        lines = content.split('\n')
        l = list(map(lambda x : list(filter(None,x.split(' '))), lines))
        keys = l[0]
        values = l[1][1:]
        for i in range(len(keys)):
            results.append({keys[i]:values[i]})
        return results


    def get_server_status(self,ip, port):
        try:
            res = {}
            inst = ["curl", "-d", "{\"token\" : \""+TOKEN+"\"}","-X","GET","http://{}:{}".format(ip,port),"-s"]
            out = (subprocess.check_output(inst)).decode('latin-1')
            contents = (json.loads(out))['content']
            res['GPU'] = self.parse_gpu_status(contents['GPU'])
            res['CPU'] = self.parse_cpu_status(contents['CPU'])
            res['MEMORY'] = self.parse_memory_status(contents['MEMORY'])
            return res
        except Exception as err:
            print(err)
            return None


    def _set_headers_failed(self):
        self.send_response(400)
        self.send_header('Content-type', 'text/html')
        self.send_header('Access-Control-Allow-Origin','*')
        self.end_headers()
        self.wfile.write(bytes(json.dumps({'content':''}),'utf-8'))


    def do_POST(self):
        content_len = int(self.headers.get('content-length'))
        contents = self.rfile.read(content_len).decode('utf-8')
        try:
            dic = json.loads(contents)
            if dic['token']!=TOKEN or len(list(dic.keys())) != 1:
                raise Exception
            results = []
            for ip, port, name in SERVERS:
                out = self.get_server_status(ip,port)
                if out is None:
                    results.append({'Server' : name, 'GPU' : [], 'CPU': [], 'MEMORY': [], 'Valid' : False})
                else:
                    out['Server'] = name
                    out['Valid'] = True
                    results.append(out)
        except Exception:
            self._set_headers_failed()
            return
        self._set_headers_success()
        response = {
            'content': results
        }
        self.wfile.write(bytes(json.dumps(response),'utf-8'))
    

    def do_OPTION(self):
        pass

    
    def do_GET(self):
        pass


if __name__=='__main__':

    parser = argparse.ArgumentParser()
    parser.add_argument('--ip', type=str, default=None)
    parser.add_argument('--port', type=int, default=None)
    args = parser.parse_args()
    
    with open(os.path.join(dir_,'token'),'r') as f:
        for line in f:
            TOKEN = line[:-1]
            break

    with open(os.path.join(dir_,'name.dict'), 'r') as f:
        for line in f:
            l = line.replace('\n',' ').split(' ')
            NAME_DICT[l[0]] = l[1]
            PAD_DICT[l[1]] = int(l[2])

    with open(os.path.join(dir_,'servers.list'),'r') as f:
        for line in f:
            l = line.replace('\n','').split(' ')
            ip, port = l[0].split(':')
            name = l[1]
            SERVERS.append((ip,port,name))
 
    if args.ip is not None and args.port is not None:
        webServer = HTTPServer((args.ip,args.port), ServerMonitor)
        try:
            webServer.serve_forever()
        except KeyboardInterrupt:
            pass
        webServer.server_close()   
