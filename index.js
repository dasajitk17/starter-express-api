const express = require('express')
const app = express()
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const { removeStopwords } = require('stopword')

// Start Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
// End Supabase



// Initialize a stemmer for natural language processing
const stemmer = natural.PorterStemmer;


const tf = require("@tensorflow/tfjs-node");
// Set the Node.js backend for TensorFlow.js
tf.setBackend("tensorflow");
// Load the model
const qna = require('@tensorflow-models/qna');
let model;

// Load the Q&A model
qna.load().then((qnaModel) => {
  model = qnaModel;
  console.log("Model loaded successfully");
}).catch((error) => {
  console.error("Error loading the Q&A model:", error);
});
app.all('/', (request, reply) => {
    
  const question = request.body.question;
  
  // Example usage
  //const keywords = extractKeywordsFromQuestion("Tell me about Google's CEO");
  //console.log(keywords);
  
  // Extract keywords from the question (you may need to implement this)
  const keywords = extractKeywordsFromQuestion(question);
  console.log(keywords);

  if (!model) {
    return { error: "Model not loaded yet" };
  }

  try {
    // Fetch the 'context' from Supabase based on the extracted keywords
    const { data: context, error } = await supabase.from('context').select('context').in('contextid', keywords);

    if (error) {
      return { error: 'Error fetching context from Supabase' };
    }

    if (!context || context.length === 0) {
      return { error: 'Context not found in the database' };
    }

    // Assuming 'context' is an array, you can take the first element as the 'passage'
    //const passage = context[0].context;
    
    // Assuming 'context' is an array, you can take all elements and concatenate them into a single 'passage'
    const passage = context.map(item => item.context).join(' ');
  
    const answers = await model.findAnswers(question, passage);
    console.log("Answers:", answers);
    return { answers };
  } catch (error) {
    console.error("Error finding answers:", error);
    return { error: "Error finding answers" };
  }
})
app.listen(process.env.PORT || 3000)
