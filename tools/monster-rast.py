# Software renderer for tools/monster-preview.js: each model is fitted into its own cell (same scale in every view of it), smooth per-pixel shading, z-buffer.
# Usage: python3 tools/monster-rast.py in.json out.png [cell] [yaw,yaw,...]   (needs numpy and pillow)
# in.json: [{id,label,tris:[x,y,z,r,g,b,nx,ny,nz, ...3 corners per triangle]}]; the model's front is -z; yaw 0 looks at its face, 90 at its left side.
import json, sys, math, numpy as np
from PIL import Image, ImageDraw
rows=json.load(open(sys.argv[1])); CELL=int(sys.argv[3]) if len(sys.argv)>3 else 300
YAWS=[float(v) for v in sys.argv[4].split(',')] if len(sys.argv)>4 else [35.0,90.0]
BG=(0.18,0.22,0.2); LIGHT=np.array([-0.4,0.6,0.7]); LIGHT/=np.linalg.norm(LIGHT)
def prep(tris):
    a=np.array(tris).reshape(-1,3,9); return a[:,:,:3].copy(), a[:,:,3:6], a[:,:,6:9].copy()
def render(P0,C,N0,yaw,s,cx,cy,cz,ymin):
    W=H=CELL; img=np.zeros((H,W,3)); img[:]=BG; zb=np.full((H,W),-1e9)
    a=math.radians(yaw); ca,sa=math.cos(a),math.sin(a)
    def rot(v,ox,oz): x=v[...,0]-ox; z=v[...,2]-oz; return np.stack([x*ca+z*sa, v[...,1], -x*sa+z*ca],-1)   # turn the model about its own vertical axis
    P=rot(P0,cx,cz); N=rot(N0,0,0)
    P=P*[1,1,-1]; N=N*[1,1,-1]   # the camera looks along +z; the front (-z) comes toward it
    n=np.cross(P[:,1]-P[:,0],P[:,2]-P[:,0]); ln=np.linalg.norm(n,axis=1)+1e-9; n=n/ln[:,None]
    miss=np.linalg.norm(N,axis=2)<0.5; N[miss]=np.repeat(n[:,None,:],3,1)[miss]
    X=W/2+P[:,:,0]*s; Y=H-14-(P[:,:,1]-ymin)*s; Z=P[:,:,2]
    for i in range(len(P)):
        x0,x1=int(max(0,X[i].min())),int(min(W-1,X[i].max()+1)); y0,y1=int(max(0,Y[i].min())),int(min(H-1,Y[i].max()+1))
        if x1<x0 or y1<y0: continue
        xs,ys=np.meshgrid(np.arange(x0,x1+1)+0.5,np.arange(y0,y1+1)+0.5)
        (ax,bx,cx_),(ay,by,cy_)=X[i],Y[i]; d=(by-cy_)*(ax-cx_)+(cx_-bx)*(ay-cy_)
        if abs(d)<1e-9: continue
        l1=((by-cy_)*(xs-cx_)+(cx_-bx)*(ys-cy_))/d; l2=((cy_-ay)*(xs-cx_)+(ax-cx_)*(ys-cy_))/d; l3=1-l1-l2
        m=(l1>=0)&(l2>=0)&(l3>=0); z=l1*Z[i,0]+l2*Z[i,1]+l3*Z[i,2]
        sub=zb[y0:y1+1,x0:x1+1]; upd=m&(z>sub)
        if not upd.any(): continue
        w=np.stack([l1[upd],l2[upd],l3[upd]],1); nn=w@N[i]; nn/=np.linalg.norm(nn,axis=1,keepdims=True)+1e-9
        sh=np.clip(np.abs(nn@LIGHT),0.15,1)*0.85+0.15
        sub[upd]=z[upd]; img[y0:y1+1,x0:x1+1][upd]=(w@C[i])*sh[:,None]
    return img
strips=[]
for r in rows:
    P,C,N=prep(r['tris']); lo=P.reshape(-1,3).min(0); hi=P.reshape(-1,3).max(0)
    cx,cz=(lo[0]+hi[0])/2,(lo[2]+hi[2])/2; ext=max(hi[1]-lo[1],math.hypot(hi[0]-lo[0],hi[2]-lo[2])); s=(CELL-34)/ext   # the turned model must stay in the cell at any yaw
    imgs=[render(P,C,N,y,s,cx,0,cz,lo[1]) for y in YAWS]
    im=Image.fromarray((np.clip(np.concatenate(imgs,1),0,1)*255).astype(np.uint8)); dr=ImageDraw.Draw(im)
    dr.text((4,2),'%s  %d tris  %.1fx%.1fx%.1f m'%(r['label'],len(P),hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2]),fill=(255,255,255))
    strips.append(np.array(im))
# lay the strips out in rows of about two per line (each strip holds len(YAWS) cells)
per=max(1,2//len(YAWS)*1) if len(YAWS)>=2 else 2
lines=[np.concatenate(strips[i:i+per]+[np.zeros_like(strips[0])]*(per-len(strips[i:i+per])),1) for i in range(0,len(strips),per)]
Image.fromarray(np.concatenate(lines,0)).save(sys.argv[2])
