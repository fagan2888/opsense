package edu.nyu.vgc.opsense.extraction;

import edu.stanford.nlp.ie.AbstractSequenceClassifier;
import edu.stanford.nlp.ie.crf.CRFClassifier;
import edu.stanford.nlp.international.Languages.Language;
import edu.stanford.nlp.ling.CoreAnnotations;
import edu.stanford.nlp.ling.CoreLabel;
import edu.stanford.nlp.ling.HasWord;
import edu.stanford.nlp.ling.IndexedWord;
import edu.stanford.nlp.ling.TaggedWord;
import edu.stanford.nlp.process.DocumentPreprocessor;
import edu.stanford.nlp.process.Morphology;
import edu.stanford.nlp.tagger.maxent.MaxentTagger;
import edu.stanford.nlp.trees.GrammaticalRelation;
import edu.stanford.nlp.trees.GrammaticalStructure;
import edu.stanford.nlp.trees.TypedDependency;

import java.io.IOException;
import java.io.StringReader;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.xalan.xsltc.dom.ExtendedSAX;


public class Parser {
	
	private String modelsDir;
	private String modelPath;
    private String taggerPath;
    private String classPath;
	
    MaxentTagger tagger;
    DpParser parser;
    AbstractSequenceClassifier<CoreLabel> classifier;
    GraphBuilder gBuilder = new GraphBuilder();
    
    Set<String> rlnDiscard = new HashSet<String>(Arrays.asList("det", "cc", "root", "punct", "expl", "discourse", "preconj", "predet"
			, "num","csubjpass","pcomp", "mark", "agent", "npadvmod","dep", "csubj", "iobj", "pobj", "parataxis","tmod", "infmod", "appos", "partmod",
			"prepc"));
	Set<String> rlnDirectLink = new HashSet<String>(Arrays.asList(
			"ccomp",
			//"dobj",
			"advcl",
			"prepc",
			"neg",
			"infmod",
			"partmod",
			"appos",
			"advmod",
			"nsubj",
			"rcmod",
			"conj",
			//"poss",
			//"prep",
			"nn",
			"amod"
			));
	Set<String> POSNodes = new HashSet<String>(Arrays.asList(
			"JJ","JJR","JJS", 					//adjectives
			"NN","NNS","NNP","NNPS", 			//Nouns
			"PRP","PRP$", 						//Pronoun
			"RB","RBR","RBS","RP", 				//Adverb
			"VB","VBD","VBG","VBN","VBP","VBZ"  //Verbs
			));
	Set<String> NounNodes = new HashSet<String>(Arrays.asList(		
			"NN","NNS","NNP","NNPS", 			//Nouns
			"PRP","PRP$" 						//Pronoun
			));
    
    public AbstractSequenceClassifier<CoreLabel> classifier() {
    	return this.classifier;
	}
    
    public Parser(String modelDir){
    	System.out.println("Parser: " + modelDir);
    	this.modelsDir = modelDir;
    	try {
    		modelPath = modelsDir + "parser/PTB_Stanford_params.txt.gz";
    	    taggerPath = modelsDir + "tagger/english-left3words-distsim.tagger";
    	    classPath = modelsDir + "classifiers/english.all.3class.distsim.crf.ser.gz";
			classifier = CRFClassifier.getClassifier(classPath);
			tagger = new MaxentTagger(taggerPath);
		    parser = DpParser.loadFromModelFile(modelPath);
		} catch (ClassCastException | ClassNotFoundException | IOException e) {
			e.printStackTrace();
		}
    }
  
    
    private static final Morphology m = new Morphology(); 
    
    public final static String lemma(String tag, String word){
        List<String> noLemma = Arrays.asList("wifi");
        if(noLemma.contains(word))
            return word;
        return m.lemma(word, tag).toLowerCase();
    }
    
    public GrammaticalRelation rlnDistance = 
    		new GrammaticalRelation(GrammaticalRelation.Language.Any, "DIST", "Distance", null);
  
    private void selectEntites(List<TaggedWord> sentence, HashMap<String, String> entities) {
    	classifier.classifySentence(sentence)
		.stream()
		.filter(w -> !w.get(CoreAnnotations.AnswerAnnotation.class).equals("O"))
		.forEach(cl -> {
    		String entity = cl.get(CoreAnnotations.AnswerAnnotation.class);
    		entities.put(cl.word() + cl.beginPosition() + cl.endPosition(), entity);
    	});
	}
    
    private List<CoreLabel> getEntites(List<TaggedWord> sentence, int sentIdx) {
    	List<CoreLabel> entities = classifier.classifySentence(sentence)
			.stream()
			.filter(w -> !w.get(CoreAnnotations.AnswerAnnotation.class).equals("O"))
			.collect(Collectors.toList());
    	entities.forEach(cl -> {
	    		String entity = cl.get(CoreAnnotations.AnswerAnnotation.class);
	    		cl.setNER(entity);
	    		cl.setSentIndex(sentIdx);
	    	});
    	return entities;
	}
    
    //Change this to Distance
    public List<TypedDependency>  selectRelations (String document) {
		DocumentPreprocessor tokenizer = new DocumentPreprocessor(new StringReader(document));
		List<TypedDependency> allDependencies = new LinkedList();
		int idx = 1;
		for (List<HasWord> sentence : tokenizer) {
	    	List<TaggedWord> tagged = tagger.tagSentence(sentence); //TAG SENTENCE
	    	GrammaticalStructure gs = parser.predict(tagged, idx++);
	    	List<CoreLabel> entities = getEntites(tagged, idx);
	    	
	    	List<TypedDependency> dependencies = gs.typedDependenciesCCprocessed()
	    			.stream().filter(ts -> 
	    					(NounNodes.contains(ts.dep().tag()) || 
	    					NounNodes.contains(ts.gov().tag())) &&
	    					rlnDirectLink.contains(ts.reln().getShortName()))
	    			.collect(Collectors.toList());
	    	
	    	dependencies.forEach(dp -> {
	    		setLemmaIfNot(dp.gov(), entities);
	    		setLemmaIfNot(dp.dep(), entities);
	    	});
	    	allDependencies.addAll(dependencies);
	    }
		return allDependencies;
    }
    
    
    public List<TypedDependency>  selectRelationsByDistance(String document, int distance) {
		DocumentPreprocessor tokenizer = new DocumentPreprocessor(new StringReader(document));
		List<TypedDependency> allDependencies = new LinkedList();
		int idx = 1;
		for (List<HasWord> sentence : tokenizer) {
	    	List<TaggedWord> tagged = tagger.tagSentence(sentence); //TAG SENTENCE
	    	List<CoreLabel> entities = getEntites(tagged, idx++);
	    	for(int i=0; i< tagged.size(); i++){
	    		if(NounNodes.contains(tagged.get(i).tag())){
	    			List<TypedDependency> dependencies = getWordDependenciesbyDistance(tagged, i, POSNodes);
	    			dependencies.forEach(dp -> {
	    	    		setLemmaIfNot(dp.gov(), entities);
	    	    		setLemmaIfNot(dp.dep(), entities);
	    	    	});
	    			
	    			allDependencies.addAll(dependencies);
	    		} else if(POSNodes.contains(tagged.get(i).tag())) {
	    			List<TypedDependency> dependencies = getWordDependenciesbyDistance(tagged, i, NounNodes);
	    			dependencies.forEach(dp -> {
	    	    		setLemmaIfNot(dp.gov(), entities);
	    	    		setLemmaIfNot(dp.dep(), entities);
	    	    	});
	    			
	    			allDependencies.addAll(dependencies);
	    		}
	    	}
	    }
		
		return allDependencies;
    }
    public List<TypedDependency> getWordDependenciesbyDistance(List<TaggedWord> tagged, int idx, Set<String> tagList){
    	List<TypedDependency> result = new LinkedList();
    	IndexedWord w1 = getIndexed(tagged.get(idx), idx);
    	for(int i = idx+1; i<tagged.size() && i <= (idx+4); i++){
    		IndexedWord w2 = getIndexed(tagged.get(i),i);
    		if(tagList.contains(w2.tag())){
    			TypedDependency tp = new TypedDependency(rlnDistance, w1, w2);
    			result.add(tp);
    		}
    	}
    	
    	return result;
    }
    
    public IndexedWord getIndexed(TaggedWord w, int idx){
    	IndexedWord w1 = new IndexedWord(w);
    	w1.setBeginPosition(w.beginPosition());
    	w1.setEndPosition(w.endPosition());
    	w1.setIndex(idx);
    	w1.setTag(w.tag());
    	return w1;
    }
    
    private void setLemmaIfNot(IndexedWord word, List<CoreLabel> entities) {
    	if(word.lemma() != null)
    		return;
    	
    	String lemma = entities.stream()
    			.filter(e -> e.word() == word.word())
    			.map(w -> w.ner()).findFirst().orElse(null);
    	if(lemma == null)
    		lemma = lemma(word.tag(), word.word());
    	word.setLemma(lemma);
    }
           /*
	public DirectedGraph<IndexedWord,RelationshipEdge<IndexedWord>> parse(String document) {
		DocumentPreprocessor tokenizer = new DocumentPreprocessor(new StringReader(document));
		List<GrammaticalStructure> result = new LinkedList<GrammaticalStructure>();
		HashMap<String, String> entities = new HashMap<>();
		int idx = 1;
	    for (List<HasWord> sentence : tokenizer) {
	    	List<TaggedWord> tagged = tagger.tagSentence(sentence);
	    	GrammaticalStructure gs = parser.predict(tagged, idx++);
	    	selectEntites(tagged, entities);
	    	result.add(gs);
	    }
	    DirectedGraph<IndexedWord, RelationshipEdge<IndexedWord>> graph = gBuilder.getGraph(result);

	    graph.vertexSet().forEach(d -> {
	    	String lemma = entities.get(d.word()+d.beginPosition()+d.endPosition()); 
	    	if(lemma == null)
	    		lemma = lemma(d.tag(), d.word());
	    	d.setLemma(lemma);
	    });
	    return graph;
	    
    }*/
}
	


