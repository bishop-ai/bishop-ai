# Bishop AI

[![Build Status](https://travis-ci.org/bishop-ai/bishop-ai.svg?branch=master)](https://travis-ci.org/bishop-ai/bishop-ai) [![GitQ](https://gitq.com/badge.svg)](https://gitq.com/bishop-ai/bishop-ai)

JS based Virtual Assistant using natural language processing.

Inspired by Siri, the Google Assistant and Alexa, Bishop AI is a conversational, contextual virtual assistant that can perform defined tasks on command. It is built to handle Q/A style conversation as well as following a conversation. Rather than trying to build a chatbot solely based on neural networks that can handle contextual conversations (the holy grail of NLP AI), Bishop AI uses a template based input/output system that is easy to understand. While the server expects natural language commands in the form of text and provides responses as text, each client can be set up to enable Speech-to-Text and Text-to-Speech. The key difference from the mainstream virtual assistants is that the functionality is broken into plugins. This allows building a customized virtual assistant that can do what the other popular assistants can do (if not more) or building a virtual assistant that is very good at a limited domain.

## Demo

For a demo of Bishop AI, visit http://bishop-ai.github.io

## Features

- Use simple API to receive text, determine intent, trigger a command and return a response
- Intent is determined by a pattern matching syntax
- Responses use a template to generate multiple alternate responses
- Trigger intents are defined in plugins and can integrate with any system that can integrate with JS

## Versioning

This project and its plugins follow the [NPM version guidlines](https://docs.npmjs.com/getting-started/semantic-versioning). Until a few more contributors build plugins, the project won't move to a 1.0.0 version. This is to ensure that the plugin structure is well defined and tested before moving to a "stable" version. **Until then, assume all minor revisions also break plugin functionality**.

## Setup

Until the project is at the point where it is hosted on NPM, follow the contribution steps below.

## Plugins

Bishop AI uses a plugin based system for commands allowing anyone to write their own custom plugin for handling specific commands. The goal is to eventually have a large ecosystem of plugins that allow integrations across many different systems. See the [Bishop AI organization page](https://github.com/bishop-ai) for examples of some existing plugins.

## Contribution

Found a bug? Have a suggestion?

Please submit issues/pull requests if you have feedback or would like to contribute. If you're interested in joining the team as a contributor, feel free to message @bishop-ai/leads.

Before you start, check out the [Contribution Guide](https://github.com/bishop-ai/bishop-ai/blob/master/docs/CONTRIBUTING.md) and [Code of Conduct](https://github.com/bishop-ai/bishop-ai/blob/master/docs/CODE_OF_CONDUCT.md)

There are two ways to contribute: 

1. Create your own plugin for everyone to use. 
2. Help on an existing plugin or the core project.

### Contribute to plugin or core development

- Check out the [source code](https://github.com/bishop-ai/bishop-ai) for the core project
- Run `npm install`
- The core functionality can be run within a NodeJS server or in a browser. See the [demo app](http://bishop-ai.github.io) for an example of working with the core API from a browser.

#### Plugin Development

All installed NPM packages with the keyword `bishop-ai-plugin` are assumed to be plugins for Bishop AI and can be enabled. 
Plugins that follow the guidelines and are submitted as NPM packages should be usable with the core platform. 

For developing a new plugin or making changes to an existing plugin, add the checked-out plugin as an optional dependency to your package.json file using the file path instead of the NPM package name. This will create a link to the plugin source and load it in Bishop AI.

package.json Example:
```json
"optionalDependencies": {
    "bishop-ai-coinflip": "file:../../bishop-ai-coinflip"
}
```