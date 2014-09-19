#!/usr/bin/env python
#
# Copyright 2014 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

"""
Utilities for the modular DevTools build.
"""

from os import path
import os

try:
    import simplejson as json
except ImportError:
    import json


def read_file(filename):
    with open(path.normpath(filename), 'rt') as input:
        return input.read()


def write_file(filename, content):
    if path.exists(filename):
        os.remove(filename)
    with open(filename, 'wt') as output:
        output.write(content)


def bail_error(message):
    raise Exception(message)


def concatenate_scripts(file_names, module_dir, output_dir, output):
    for file_name in file_names:
        output.write('/* %s */\n' % file_name)
        file_path = path.join(module_dir, file_name)
        if not path.isfile(file_path):
            file_path = path.join(output_dir, path.basename(module_dir), file_name)
        output.write(read_file(file_path))
        output.write(';')


class Descriptors:
    def __init__(self, application_dir, application_descriptor, module_descriptors, application_json):
        self.application_dir = application_dir
        self.application = application_descriptor
        self.modules = module_descriptors
        self.application_json = application_json

    def all_compiled_files(self):
        files = {}
        for name in self.modules:
            module = self.modules[name]
            skipped_files = set(module.get('skip_compilation', []))
            for script in module.get('scripts', []):
                if script not in skipped_files:
                    files[path.normpath(path.join(self.application_dir, name, script))] = True
        return files.keys()

    def module_compiled_files(self, name):
        files = []
        module = self.modules[name]
        skipped_files = set(module.get('skip_compilation', []))
        for script in module.get('scripts', []):
            if script not in skipped_files:
                files.append(script)
        return files

    def sorted_modules(self):
        result = []
        unvisited_modules = set(self.modules)
        temp_modules = set()

        def visit(parent, name):
            if name not in unvisited_modules:
                return None
            if name not in self.modules:
                return (parent, name)
            if name in temp_modules:
                bail_error('Dependency cycle found at module "%s"' % name)
            temp_modules.add(name)
            deps = self.modules[name].get('dependencies')
            if deps:
                for dep_name in deps:
                    bad_dep = visit(name, dep_name)
                    if bad_dep:
                        return bad_dep
            unvisited_modules.remove(name)
            temp_modules.remove(name)
            result.append(name)
            return None

        while len(unvisited_modules):
            for next in unvisited_modules:
                break
            failure = visit(None, next)
            if failure:
                # failure[0] can never be None
                bail_error('Unknown module "%s" encountered in dependencies of "%s"' % (failure[1], failure[0]))

        return result


class DescriptorLoader:
    def __init__(self, application_dir):
        self.application_dir = application_dir

    def load_application(self, application_descriptor_name):
        application_descriptor_filename = path.join(self.application_dir, application_descriptor_name)
        application_descriptor_json = read_file(application_descriptor_filename)
        application_descriptor = {desc['name']: desc for desc in json.loads(application_descriptor_json)}

        module_descriptors = {}
        for (module_name, module) in application_descriptor.items():
            if module_descriptors.get(module_name):
                bail_error('Duplicate definition of module "%s" in %s' % (module_name, application_descriptor_filename))
            module_json_filename = path.join(self.application_dir, module_name, 'module.json')
            module_descriptors[module_name] = self._read_module_descriptor(module_name, application_descriptor_filename)

        return Descriptors(self.application_dir, application_descriptor, module_descriptors, application_descriptor_json)

    def _read_module_descriptor(self, module_name, application_descriptor_filename):
        json_filename = path.join(self.application_dir, module_name, 'module.json')
        if not path.exists(json_filename):
            bail_error('Module descriptor %s referenced in %s is missing' % (json_filename, application_descriptor_filename))
        module_json = json.loads(read_file(json_filename))
        module_json['name'] = module_name
        return module_json
