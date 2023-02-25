import './App.css';
import * as React from 'react';

import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import LinearProgress from '@mui/material/LinearProgress';

import nltm from './nltm.png';
import bhashini from './bhashini.png';


import MenuItem from '@mui/material/MenuItem';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import getBlobDuration from 'get-blob-duration'

import {useEffect, useState} from 'react';

import { ReactMic } from 'react-mic';

const axios = require('axios').default;

var source = "en";
var target = "mr";
var source_text_var = "";
var target_text_var = "";

function App() {

  const source_languages = [{'code': 'hi', 'name': 'Hindi'},
                            {'code': 'en', 'name': 'English'},
                            {'code': 'mr', 'name': 'Marathi 1 (Under Development)'},
                            {'code': 'mr_2', 'name': 'Marathi 2 (Under Development)'}
                          ];

  const target_languages = [{'code': 'hi', 'name': 'Hindi'},
                            {'code': 'mr', 'name': 'Marathi'}
                          ];

  const [audioFile, setAudioFile] = useState("");
  const [outputAudioFile, setOutputAudioFile] = useState("");
  const [record, setRecord] = useState(false);
  const [loading, setLoading] = useState(false);
  const [source_lang, setSourceLang] = useState("en");
  const [target_lang, setTargetLang] = useState("mr");
  const [source_text, setSourceText] = useState("");
  const [target_text, setTargetText] = useState("");

  
  useEffect(()=>{
    if(outputAudioFile !== ""){
      var audio_tag = document.getElementById('target-audio');
      audio_tag.play();
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
    setRecord(true);
  }

  const stopRecording = ()=>{
    setRecord(false);
  }

  const onData = function(recordedBlob){

  }

  const onStop = function(recordedBlob){
    var url = URL.createObjectURL(recordedBlob.blob);
    setAudioFile(url);
    translate_text(recordedBlob);
  }

  function handle_source_text(text){

    var source = source_text_var + text + "\n";
    setSourceText(source);
  
  }

  function handle_target_text(text){

    var target = target_text_var + text + "\n";
    setTargetText(target);
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

  function handle_start(blob){
    console.log("starting");
    getBlobDuration(blob).then(function(duration) {
      console.log(duration + ' seconds');
    });
    
  };
  
  function translate_text(recordedBlob){
    
    var api_url = "https://www.cfilt.iitb.ac.in/en-hi/text";
    
    const params = JSON.stringify({'sourceLanguage': source});

    var formData = new FormData();
    formData.append('files', recordedBlob['blob']);
    formData.append("data", params);

    setOutputAudioFile("");

    axios({
      method: 'POST',
      url: api_url,
      data: formData,
      headers:{'Content-Type': 'multipart/form-data'}
      }).then(res=>{

          var text_output = res.data.text;
          handle_source_text(text_output);

          translate_speech(text_output);

    });
  };

  function translate_speech(current_text){
    setLoading(true);
    var api_url = "https://www.cfilt.iitb.ac.in/en-hi/speech";
    
    const params = JSON.stringify({'language': {'sourceLanguage': source, 'targetLanguage': target}, 'text': current_text});
    
    var formData = new FormData();
    formData.append("data", params);

    axios({
      method: 'post',
      url: api_url,
      data: formData,
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      resposeType: 'blob'
    }).then(res=>{
      console.log(res.data);
      handle_target_text(res.data.text.target_text);
      
      setLoading(false);

      var blob = b64toBlob(res.data.data, 'audio/wav');

      var url = URL.createObjectURL(blob);
      
      setOutputAudioFile(url);

      handle_start(blob);


    });
  };

  return (
    <div className="App">
      <nav class="navbar navbar-dark bg-primary" style={{"width": "1200px","font-weight": "bold", "font-size": "30px", "m":"1"}}>

        <Box sx={{width: "1200px", display: 'flex', justifyContent: "space-between", flexDirection: 'row', m:-2}}>
          <img style={{"height": "50px", "width": "320px"}} src={nltm} alt="nltm"/>
          <Box sx={{display: 'flex', flexDirection: 'column'}}>
            <span class="navbar-brand mb-0 h1">IIT Bombay Speech to Speech Machine Translation System</span>
            <small>(on behalf of a consortium of institutes under Bhashini)</small>
          </Box>

          <img style={{"height": "60px", "width": "200px"}} src={bhashini} alt="bhashini"/>
        </Box>
      </nav>

      <Box sx={{ width: '1200px', height: '500px', display: 'flex', flexDirection: 'column'}}>
        <Box sx={{ display: 'flex', flexDirection: 'column', m:-1}}>
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
              <>{ loading &&
                <LinearProgress />
              }</>
              
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
