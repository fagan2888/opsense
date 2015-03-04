package edu.nyu.vgc.opsense.extraction;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.PrintStream;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.jgrapht.DirectedGraph;
import org.jgrapht.graph.DefaultDirectedGraph;
import org.jgrapht.graph.DefaultEdge;

import edu.stanford.nlp.ling.IndexedWord;
import edu.stanford.nlp.trees.GrammaticalStructure;

public class GraphBuilder {
	Set<String> rlnDiscard = new HashSet<String>(Arrays.asList("det", "cc", "root", "punct", "expl", "discourse", "preconj", "predet"
			, "num","csubjpass","pcomp", "mark", "agent", "npadvmod", "csubj", "iobj", "pobj", "parataxis","tmod", "infmod", "appos", "partmod",
			"prepc"));
	//Set<String> rlnDirectLink = new HashSet<String>(Arrays.asList("nsubj", "amod", "nn", "prep"));
	Set<String> POSNodes = new HashSet<String>(Arrays.asList(
			"JJ","JJR","JJS", 					//adjectives
			"NN","NNS","NNP","NNPS", 			//Nouns
			"PRP","PRP$", 						//Pronoun
			"RB","RBR","RBS","RP", 				//Adverb
			"VB","VBD","VBG","VBN","VBP","VBZ", "ROOT"  //Verbs
			));
	
	
	public class RelationshipEdge<V> extends DefaultEdge{
		private static final long serialVersionUID = 1L;
		private V v1;
        private V v2;
        private String label;

        public RelationshipEdge(V v1, V v2, String label) {
            this.v1 = v1;
            this.v2 = v2;
            this.label = label;
        }

        public V gov() {
            return v1;
        }

        public V dep() {
            return v2;
        }
        
        public String label() {
            return label;
        }

        public String toString() {
            return label;
        }
		
	}
	
	public DirectedGraph<IndexedWord, RelationshipEdge<IndexedWord>> getGraph(List<GrammaticalStructure> list) {
		DirectedGraph<IndexedWord, RelationshipEdge<IndexedWord>> graph = new DefaultDirectedGraph<IndexedWord, RelationshipEdge<IndexedWord>>((Class<? extends RelationshipEdge<IndexedWord>>) RelationshipEdge.class);
		
		list.stream().forEach(gs -> {
			
			//Select Nodes------------------------------
			gs.typedDependenciesCCprocessed()
				.stream()
				.filter(tp -> !rlnDiscard.contains(tp.reln().getShortName())) 
				.forEach(tp ->{
					IndexedWord gov = tp.gov();
					IndexedWord dep = tp.dep();
					String reln = tp.reln().getShortName();
					
					if(	POSNodes.contains(dep.tag()) && 
						POSNodes.contains(gov.tag())){
							graph.addVertex(gov);
							graph.addVertex(dep);
							graph.addEdge(gov, dep, new RelationshipEdge<>(gov, dep, reln));
					}

				});
		});
		getGramns(list);
		return graph;
	}
	
	public void getGramns(List<GrammaticalStructure> list) {
		list.stream().forEach(gs -> {
			gs.typedDependenciesCCprocessed().forEach(tp -> {
				IndexedWord gov = tp.gov();
				IndexedWord dep = tp.dep();
				String reln = tp.reln().getShortName();
				
				if(	POSNodes.contains(dep.tag()) && 
					POSNodes.contains(gov.tag())){
					
					try(PrintWriter out = new PrintWriter(new BufferedWriter(new FileWriter("/Users/cristian/Downloads/yelp_dataset_challenge_academic_dataset/processed.csv", true)))) {
						out.println(gov.tag().substring(0, 2) + ";" + dep.tag().substring(0,2) + ";" + reln);
						//ORGINIAL - out.println(result.toString());
						//TEST - printJson(result);
						
					} catch (Exception ex){
						
					}
					
					
				}
			});
			
			
		});
	
	}
	
	
	
	public void $printTable(GrammaticalStructure gs){
		$printTable(gs, System.out);
	}
	
	public void $printTable(GrammaticalStructure gs, PrintWriter out){
		gs.typedDependenciesCCprocessed().stream()
		.filter(tp -> POSNodes.contains(tp.dep().tag()) && POSNodes.contains(tp.gov().tag())) 
		.forEach(tp ->{
			String gov = String.format("%-30s", tp.gov()+"|");
			String dep = String.format("%-30s", tp.dep()+"|");
			String rll = String.format("%-30s", tp.reln().getLongName()+"|");
			String rls = String.format("%-30s", tp.reln().getShortName()+"|");
			
			out.println(gov + dep + rls + rll);
			
		});
		out.println("");
	}
	
	public void $printTable(GrammaticalStructure gs, PrintStream out){
		gs.typedDependenciesCCprocessed()
		.forEach(tp ->{
			String gov = String.format("%-30s", tp.gov()+"|");
			String dep = String.format("%-30s", tp.dep()+"|");
			String rll = String.format("%-30s", tp.reln().getLongName()+"|");
			String rls = String.format("%-30s", tp.reln().getShortName()+"|");
			
			out.println(gov + dep + rls + rll);
			
		});
		out.println("");
	}
}
