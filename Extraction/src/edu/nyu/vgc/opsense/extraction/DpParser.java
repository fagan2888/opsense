package edu.nyu.vgc.opsense.extraction;

import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import edu.stanford.nlp.ling.CoreAnnotations;
import edu.stanford.nlp.ling.CoreLabel;
import edu.stanford.nlp.ling.HasOffset;
import edu.stanford.nlp.ling.HasTag;
import edu.stanford.nlp.ling.HasWord;
import edu.stanford.nlp.parser.nndep.DependencyParser;
import edu.stanford.nlp.trees.GrammaticalStructure;

public class DpParser extends DependencyParser
{
	public DpParser(){
		this(new Properties());
	}
	
	public DpParser(Properties properties) {
		super(properties);
		// TODO Auto-generated constructor stub
	}
	
	public GrammaticalStructure predict(List<? extends HasWord> sentence, int idx) {
	    CoreLabel sentenceLabel = new CoreLabel();
	    List<CoreLabel> tokens = new ArrayList<>();

	    int i = 1;
	    for (HasWord wd : sentence) {
	      CoreLabel label;
	      if (wd instanceof CoreLabel) {
	        label = (CoreLabel) wd;
	        if (label.tag() == null)
	          throw new IllegalArgumentException("Parser requires words " +
	              "with part-of-speech tag annotations");
	      } else {
	        label = new CoreLabel();
	        label.setValue(wd.word());
	        label.setWord(wd.word());
	        label.setBeginPosition(((HasOffset)wd).beginPosition());
	        label.setEndPosition(((HasOffset)wd).endPosition());
	        label.setSentIndex(idx);
	        if (!(wd instanceof HasTag))
	          throw new IllegalArgumentException("Parser requires words " +
	              "with part-of-speech tag annotations");

	        label.setTag(((HasTag) wd).tag());
	      }

	      label.setIndex(i);
	      i++;

	      tokens.add(label);
	    }

	    sentenceLabel.set(CoreAnnotations.TokensAnnotation.class, tokens);

	    return predict(sentenceLabel);
	 }

	
	public static DpParser loadFromModelFile(String modelFile) {
	    return loadFromModelFile(modelFile, null);
	}
	
	 public static DpParser loadFromModelFile(String modelFile, Properties extraProperties) {
		 	DpParser parser = extraProperties == null ? new DpParser() : new DpParser(extraProperties);
		    parser.loadModelFile(modelFile);
		    return parser;
	 } 
	 @Override
	public String toString() {
		// TODO Auto-generated method stub
		return "sss";
	}

}
