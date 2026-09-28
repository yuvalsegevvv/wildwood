# Tiny software renderer for tools/model-preview.js: smooth (per-pixel, interpolated normals) shading + z-buffer, front and side view per character.
# Usage: python3 tools/rast.py in.json out.png [width height [headY]]   (needs numpy and pillow)
import json, sys, numpy as np
from PIL import Image
chars=json.load(open(sys.argv[1])); HEAD=float(sys.argv[5]) if len(sys.argv)>5 else 0; W,H=int(sys.argv[3]) if len(sys.argv)>3 else 180,int(sys.argv[4]) if len(sys.argv)>4 else 320; S=H*0.47 if len(sys.argv)<6 else H*2.4
def render(tris,view):
    img=np.zeros((H,W,3)); img[:]=(0.18,0.22,0.2); zb=np.full((H,W),-1e9)
    a=np.array(tris).reshape(-1,3,9); P=a[:,:,:3].copy(); C=a[:,:,3:6]; N=a[:,:,6:9].copy()
    if view=='side': P=P[:,:,[2,1,0]]*[-1,1,1]; N=N[:,:,[2,1,0]]*[-1,1,1]
    else: P=P*[1,1,-1]; N=N*[1,1,-1]
    n=np.cross(P[:,1]-P[:,0],P[:,2]-P[:,0]); ln=np.linalg.norm(n,axis=1)+1e-9; n=n/ln[:,None]
    miss=np.linalg.norm(N,axis=2)<0.5; N[miss]=np.repeat(n[:,None,:],3,1)[miss]   # no normals: flat
    light=np.array([-0.4,0.6,0.7]); light/=np.linalg.norm(light)
    X=W/2+P[:,:,0]*S; Y=(H-10-P[:,:,1]*S) if not HEAD else (H/2-(P[:,:,1]-HEAD)*S); Z=P[:,:,2]
    for i in range(len(P)):
        x0,x1=int(max(0,X[i].min())),int(min(W-1,X[i].max()+1)); y0,y1=int(max(0,Y[i].min())),int(min(H-1,Y[i].max()+1))
        if x1<x0 or y1<y0: continue
        xs,ys=np.meshgrid(np.arange(x0,x1+1)+0.5,np.arange(y0,y1+1)+0.5)
        (ax,bx,cx),(ay,by,cy)=X[i],Y[i]; d=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
        if abs(d)<1e-9: continue
        l1=((by-cy)*(xs-cx)+(cx-bx)*(ys-cy))/d; l2=((cy-ay)*(xs-cx)+(ax-cx)*(ys-cy))/d; l3=1-l1-l2
        m=(l1>=0)&(l2>=0)&(l3>=0); z=l1*Z[i,0]+l2*Z[i,1]+l3*Z[i,2]
        sub=zb[y0:y1+1,x0:x1+1]; upd=m&(z>sub)
        if not upd.any(): continue
        w=np.stack([l1[upd],l2[upd],l3[upd]],1); nn=w@N[i]; nn/=np.linalg.norm(nn,axis=1,keepdims=True)+1e-9
        sh=np.clip(np.abs(nn@light),0.15,1)*0.85+0.15
        sub[upd]=z[upd]; img[y0:y1+1,x0:x1+1][upd]=(w@C[i])*sh[:,None]
    return img
rows=[np.concatenate([render(t,'front'),render(t,'side')],1) for t in chars]
Image.fromarray((np.clip(np.concatenate(rows,1),0,1)*255).astype(np.uint8)).save(sys.argv[2])
