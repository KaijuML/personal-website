---
title: "Data-QuestEval: A Referenceless Metric for Data-to-Text Semantic Evaluation"
date: 2021-08-25
authors:
  [
    ["Clément Rebuffel", "/"],
    ["Thomas Scialom", "https://www.linkedin.com/in/tscialom/"],
    ["Laure Soulier", "https://mlia.lip6.fr/soulier/"],
    ["Benjamin Piwowarski", "http://www.piwowarski.fr/"],
    [
      "Sylvain Lamprier",
      "https://www.linkedin.com/in/sylvain-lamprier-99666a74/",
    ],
    ["Jacopo Staiano", "https://www.staiano.net/"],
    ["Geoffrey Scoutheeten", "https://fr.linkedin.com/in/scout"],
    [
      "Patrick Gallinari",
      "https://fr.linkedin.com/in/patrick-gallinari-88b43b6",
    ],
  ]
arxiv: "https://arxiv.org/abs/2104.07555"
conference:
  [
    "Empirical Methods in Natural Language Processing (EMNLP 2021)",
    "https://2021.emnlp.org/",
  ]

sitemap_exclude: True
---

QuestEval is a reference-less metric used in text-to-text tasks, that compares the generated summaries directly to the source text, by automatically asking and answering questions. Its adaptation to Data-to-Text tasks is not straightforward as it requires multimodal Question Generation and Answering systems on the considered tasks, which are seldom available. To this purpose, we propose a method to build synthetic multimodal corpora enabling to train multimodal components for a data-QuestEval metric.
The resulting metric is reference-less and multimodal; it obtains state-of-the-art correlations with human judgment on the WebNLG and WikiBio benchmarks. We make data-QuestEval's code and models available for reproducibility purpose, as part of the QuestEval project.
