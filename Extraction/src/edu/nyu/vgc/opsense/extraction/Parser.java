package edu.nyu.vgc.opsense.extraction;

import edu.stanford.nlp.ling.HasWord;
import edu.stanford.nlp.ling.TaggedWord;
import edu.stanford.nlp.parser.nndep.DependencyParser;
import edu.stanford.nlp.process.DocumentPreprocessor;
import edu.stanford.nlp.tagger.maxent.MaxentTagger;
import edu.stanford.nlp.trees.GrammaticalStructure;

import java.io.StringReader;
import java.util.List;

public class Parser {
	private String modelPath = DependencyParser.DEFAULT_MODEL;
    private String taggerPath = "edu/stanford/nlp/models/pos-tagger/english-left3words/english-left3words-distsim.tagger";
    
    MaxentTagger tagger = new MaxentTagger(taggerPath);
    DependencyParser parser = DependencyParser.loadFromModelFile(modelPath);
    
	public void parse(String document) {
		DocumentPreprocessor tokenizer = new DocumentPreprocessor(new StringReader(document));
	    for (List<HasWord> sentence : tokenizer) {
	      List<TaggedWord> tagged = tagger.tagSentence(sentence);
	      GrammaticalStructure gs = parser.predict(tagged);

	      // Print typed dependencies
	      System.err.println(gs);
	    }
	  }
	}
