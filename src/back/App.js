// import logo from './logo.svg';
import './App.css';
import * as React from 'react';

import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
// import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';


import MenuItem from '@mui/material/MenuItem';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import getBlobDuration from 'get-blob-duration'

import {useEffect, useState} from 'react';

import { ReactMic } from 'react-mic';

import hark from 'hark';
import Crunker from 'crunker';

const axios = require('axios').default;

var source = "en";
var target = "mr";
var source_text_var = "";
var target_text_var = "";
var urls = [];
var global_url;
var global_url_set = false;
var output_url_var;
var min=1;
var max=100;
var rand = Math.floor(min + Math.random() * (max - min));
var first = true;
// var byteArrays = [];
function App() {

  const source_languages = [{'code': 'hi', 'name': 'Hindi'},
                            {'code': 'en', 'name': 'English'}
                          ];

  const target_languages = [{'code': 'hi', 'name': 'Hindi'},
                            {'code': 'mr', 'name': 'Marathi'}
                          ];

  const [audioFile, setAudioFile] = useState("");
  const [outputAudioFile, setOutputAudioFile] = useState("");
  const [record, setRecord] = useState(false);
  const [speak, setSpeak] = useState(false);
  const [record_once, setRecordOnce] = useState(false);
  const [source_lang, setSourceLang] = useState("en");
  const [target_lang, setTargetLang] = useState("mr");
  const [source_text, setSourceText] = useState("");
  const [target_text, setTargetText] = useState("");
  const [output_url, setOutputUrl] = useState();

  var getUserMedia = require('getusermedia');
  var base64 = require('base-64');
  var ConcatenateBlobs = require('concatenateblobs');
  let audioMaker = require('audiomaker');
  let _audioMaker = new audioMaker();

  let crunker = new Crunker();




  getUserMedia({video: false, audio: true}, function(err, stream) {
    // if (err) {
    //   console.log('failed');
    // } else {
    //     console.log('got a stream', stream);  
    // }


    var options = {"interval": 200};
    var speechEvents = hark(stream, options);

    speechEvents.on('speaking', function() {
      if(record === true)
        setSpeak(true);
      // if(record_once === true && record === false)
      //   startRecording();
    });

    speechEvents.on('stopped_speaking', function() {
      if(record === true && speak === true){
        stopRecording();
        setSpeak(false);
      }
    });
  });

  useEffect(()=>{
    if(outputAudioFile !== ""){
      var audio_tag = document.getElementById('target-audio');
      // console.log("playing");
      audio_tag.play();
      // if(first === true){
      //   audio_tag.muted = true;
      //   audio_tag.play();
      //   first = false;
      //   // audio_tag.muted = false;
      // }
    }
  },[outputAudioFile]);


  useEffect(()=>{
    source = source_lang;
  },[source_lang]);
  
  useEffect(()=>{
    target = target_lang;
  },[target_lang]);

  useEffect(()=>{
    source_text_var = source_text;
  },[source_text]);

  useEffect(()=>{
    target_text_var = target_text;
  },[target_text]);

  const startRecording = ()=>{
    // console.log("recording");
    setRecordOnce(true);
    setRecord(true);
  }

  const stopRecording = ()=>{
    setRecord(false);
  }

  const onData = function(recordedBlob){
    // console.log("getting data");
  }

  const onStop = function(recordedBlob){
    var url = URL.createObjectURL(recordedBlob.blob);
    setAudioFile(url);
    translate_speech(recordedBlob);
  }

 
  const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
  
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    console.log(byteArrays.length);
    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
  }

  function base64ToArray(base64) {
    var binary_string = atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }

    return bytes;
  }

  function handle_text(text){

    // console.log(source_text_var);
    var source = source_text_var + text["source_text"] + "\n";
    setSourceText(source);
    
    var target = target_text_var + text["target_text"] + "\n";
    setTargetText(target);
  
  }

  function handle_start(blob){
    console.log("starting");
    getBlobDuration(blob).then(function(duration) {
      console.log(duration + ' seconds');

      console.log("start");
      setTimeout(function() {
        console.log("end");
        startRecording();
      }, duration*1000);

    });
    
    // startRecording();
  }
  
  function handle_url(url){
    
    if(global_url_set === true){
      console.log("if");
        crunker
        .fetchAudio(global_url, url)
        .then(buffers => crunker.concatAudio(buffers))
        .then(merged => crunker.export(merged, "audio/wav"))
        .then(output => { setOutputUrl(output.url); console.log(output_url);});
    }
    else{
      console.log("else");
      setOutputUrl(url);
      global_url = url;
      global_url_set = true;
    }
  }

  function translate_speech(recordedBlob){

    var api_url = "https://www.cfilt.iitb.ac.in/en-hi/";
    
    // console.log("source_lang", source);
    // console.log("target_lang", target);
    console.log(rand);
    const params = JSON.stringify({'sourceLanguage': source, 'targetLanguage': target, 'number': rand});

    var formData = new FormData();
    formData.append('files', recordedBlob['blob']);
    formData.append("data", params);

    setOutputAudioFile("");
    // startRecording();
    axios({
      method: 'POST',
      url: api_url,
      data: formData,
      headers:{'Content-Type': 'multipart/form-data'},
      // responseType: 'blob',
      }).then(res=>{
          // console.log(res.data);

          handle_text(res.data.text);
          
          // var data = new Buffer(res.data, 'base64').toString('ascii');
          // var byte_array = b64toBlob(res.data.data, 'audio/wav');

          // var byte_array = base64.decode(res.data.data);

          // var bytes = base64ToArray(res.data.data);
          // bytes_array = bytes_array.concat(bytes);
          // var blob = new Blob(bytes_array, {type: 'audio/wav'});

          var blob = b64toBlob(res.data.data, 'audio/wav');
          // blobs.push(blob);

          // var output_blob;
          
        
          // var url = URL.createObjectURL(new Blob([res.data], {type: 'audio/wav'}));
          var url = URL.createObjectURL(blob);

          // handle_url(url);
          

          // console.log(output_url_var);
          setOutputAudioFile(url);
          // console.log(outputAudioFile);
          handle_start(blob);
    });

  };

  return (
    <div className="App">
      <nav class="navbar navbar-dark bg-primary" style={{"font-weight": "bold", "font-size": "30px"}}>
        <span class="navbar-brand mb-0 h1">IIT Bombay Speech to Speech Machine Translation</span>
      </nav>

      <Box sx={{ width: '1200px', height: '500px', display: 'flex', flexDirection: 'column'}}>
        <Box sx={{ display: 'flex', flexDirection: 'column', m:1}}>
          <Box sx={{ display: 'flex', justifyContent: "center", flexDirection: 'row'}}>
            <TextField id="src-lang" sx={{mr: 5}} value={source_lang} select label="Source" size="small" style={{"font-family": "inherit", height: "75px", width: "300px"}} onChange={e=>setSourceLang(e.target.value)}>
              {source_languages.map(language=> <MenuItem key={language.code} value={language.code}>{language.name}</MenuItem>)}
            </TextField>
            <TextField id="tgt-lang" sx={{ml: 5}} value={target_lang} select label="Target" size="small" style={{"font-family": "inherit", height: "75px", width: "300px"}} onChange={e=>setTargetLang(e.target.value)}>
              {target_languages.map(language=> <MenuItem key={language.code} value={language.code}>{language.name}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: "center", flexDirection: 'row', m:1}}>
            <Paper sx={{ display: 'flex', justifyContent: "center", flexDirection: 'column', height: 400, width: 500, m:2}} elevation={5}>
              <TextareaAutosize value={source_text} aria-label="source textarea" style={{ height: 330, width: 480, m: 2, overflow: 'auto'}}/>
              <ReactMic
              record={record}
              className="sound-wave"
              onStop={onStop}
              onData={onData}
              strokeColor="#000000"
              backgroundColor="#FFFFFF"
              sampleRate={96000}
              mimeType="audio/wav" />
              <Box sx={{ display: 'flex', justifyContent: "center", flexDirection: 'row'}}>
                <IconButton disabled={record} sx={{height: "50px", width: "50px", "m-r": "2"}} onClick={startRecording} type="button"><MicIcon fontSize="large"/></IconButton>
                <IconButton disabled={!record} sx={{height: "50px", width: "50px", "m-l": "2"}} onClick={stopRecording} type="button"><StopCircleIcon fontSize="large"/></IconButton>  
              </Box>
              <Box sx={{ display: 'flex', justifyContent: "center", flexDirection: 'row'}}>
                <audio controls src={audioFile}></audio>
              </Box>
            </Paper>
            <Paper elevation={5} sx={{display: 'flex', justifyContent: "center", flexDirection: 'column', height: 400, width: 500, m:2}}>
              <TextareaAutosize value={target_text} aria-label="source textarea" style={{ height: 330, width: 480, m: 2, overflow: 'auto'}}/>
              <Box sx={{ display: 'flex', justifyContent: "center", flexDirection: 'row'}}>
                <audio id="target-audio" controls src={outputAudioFile} autoplay></audio>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </div>
  );
}

export default App;
