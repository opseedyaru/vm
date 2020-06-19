return `npm -g install ytdl
ytdl "http://www.youtube.com/watch?v=`+('v' in qp?qp.v:"MQWMDBqCE6w")+`" > myvideo.mp4
if [ ! -f "ffmpeg" ]; then
  wget https://ff-bin.now.sh/ffmpeg.zip
  unzip ffmpeg.zip
  chmod +x ffmpeg
  echo "wget-ok"
  ls -lht|grep ffmpeg
fi
cat myvideo.mp4|./ffmpeg -i pipe:0 -b:a 192K -vn myfile.mp3
`;
