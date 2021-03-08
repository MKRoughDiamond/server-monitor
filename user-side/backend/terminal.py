import subprocess
import io
import sys
import json
import os

NAME_DICT = {}
PAD_DICT = {}
TOKEN = None
dir_ = os.path.dirname(__file__)

def get_server_gpu_status(ip, port):
    try:
        results = []
        inst = ["curl", "-d", "{\"token\" : \""+TOKEN+"\"}","-X","GET","http://{}:{}".format(ip,port),"-s"]
        out = (subprocess.check_output(inst)).decode('utf-8')
        lines = (json.loads(out))['content'].split('\n')
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
    except Exception as err:
        print(err)
        return None

def print_status(ip, port,name):
    try:
        results = get_server_gpu_status(ip,port)
        keys = list(map(lambda x : list(x.keys())[0],results[0]))
    except Exception:
        print('Failed to connect to {}:{}, {}'.format(ip,port,name))
        return
    print('Status of {}:{}, {}'.format(ip, port, name))
    for key in keys:
        print(key.ljust(PAD_DICT[key]),end='')
    print()
    for item in results:
        for i,key in enumerate(keys):
            if len(item[i][key]) >= PAD_DICT[key]:
                print((item[i][key][:PAD_DICT[key]-4]+'...').ljust(PAD_DICT[key]),end='')
            else:
                print(item[i][key].ljust(PAD_DICT[key]),end='')
        print()


### TODO : Add Arguments (ArgumentParser)
###        Security
###        Utility (Such as 'watch', 'list', 'ip/port', 'process' etc.

if __name__=='__main__':
    with open(os.path.join(dir_,'token'),'r') as f:
        for line in f:
            TOKEN = line[:-1]
            break

    with open(os.path.join(dir_,'name.dict'), 'r') as f:
        for line in f:
            l = line.split(' ')
            NAME_DICT[l[0]] = l[1]
            PAD_DICT[l[1]] = int(l[2][:-1])

    with open(os.path.join(dir_,'servers.list'),'r') as f:
        for line in f:
            l = line.replace('\n','').split(' ')
            ip, port = l[0].split(':')
            name = l[1]
            print_status(ip,port,name)
