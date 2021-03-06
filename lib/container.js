/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

var bunyan = require('bunyan');
var aws = require('aws-sdk');
var _ = require('lodash');



module.exports = function(config, logger) {
  logger = logger || bunyan.createLogger({name: 'aws-elb-container'});


  /**
   * build the container
   * cdef - contianer definition block
   * out - ouput stream
   * cb - complete callback
   */
  var build = function build(mode, system, cdef, out, cb) {
    logger.info('building');
    out.stdout('building');
    cb();
  };



  /**
   * deploy the continaer
   * target - target to deploy to
   * system - the target system defintinion
   * cdef - the contianer definition
   * container - the container as defined in the system topology
   * out - ouput stream
   * cb - complete callback
   */
   var deploy = function deploy(mode, target, system, containerDef, container, out, cb) {
    var elb = new aws.ELB(config);

    delete container.specific.AvailabilityZones;
    if (!container.specific.Subnets) {
      container.specific.Subnets = [config.defaultSubnetId];
    }

    var loadBalancerName = container.id;
    var nscaleSystemTag = system.name + '-' + system.topology.name;
    var nscaleIdTag = nscaleSystemTag + '-' + loadBalancerName;

    elb.describeTags({LoadBalancerNames: [loadBalancerName]}, function (err, data) {
      if (err && err.name !== 'LoadBalancerNotFound') {
        return cb(err);
      }

      container.specific.LoadBalancerName = loadBalancerName;

      // if we have err here it is a LoadBalancerNotFound.
      if (!err && _.chain(data.TagDescriptions)
          .pluck('Tags')
          .flatten()
          .find(function (tag) {
            return tag.Key === 'nscale-id' && tag.Value === nscaleIdTag;
          })
          .value()) {
        return cb(null, system);
      }

      if (mode === 'preview') {
        out.preview({cmd: 'elb.createLoadBalancer(' + JSON.stringify(container.specific, null, 2) + ')', host: null, user: null, keyPath: null});
        return cb(null, system);
      }

      elb.createLoadBalancer(container.specific, function(err, data) {
        if (err) { return cb(err); }

        var tagParams = {LoadBalancerNames: [container.specific.LoadBalancerName], Tags: container.specific.Tags || []};
        tagParams.Tags.push({Key: 'nscale-system', Value: nscaleSystemTag});
        tagParams.Tags.push({Key: 'nscale-id', Value: nscaleIdTag});
        tagParams.Tags.push({Key: 'Name', Value: loadBalancerName});

        elb.addTags(tagParams, function(err) {
          if (err) { return cb(err); }
          var c = _.find(system.topology.containers, function(cont) { return cont.id === container.id; });
          c.nativeId = data.DNSName;
          system.dirty = true;
          var params = {
            HealthCheck: {
              HealthyThreshold: 2,
              Interval: 30,
              Target: 'TCP:' + container.specific.Listeners[0].InstancePort,
              Timeout: 5,
              UnhealthyThreshold: 10
            },
            LoadBalancerName: loadBalancerName
          };
          elb.configureHealthCheck(params, function(err, data) {
            if (err) { return cb(err); }
            cb(null, system);
          });
        });
      });
    });
  };




  /**
   * undeploy the container from the target
   * target - target to deploy to
   * system - the target system defintinion
   * cdef - the contianer definition
   * container - the container as defined in the system topology
   * out - ouput stream
   * cb - complete callback
   */
  var undeploy = function undeploy(mode, target, system, containerDef, container, out, cb) {
    logger.info('undeploying');
    out.stdout('undeploying');
    //TODO: delete load balancer
    cb();
  };



  /**
   * start the container on the target
   * target - target to deploy to
   * system - the target system defintinion
   * cdef - the contianer definition
   * container - the container as defined in the system topology
   * out - ouput stream
   * cb - complete callback
   */
  var start = function start(mode, target, system, containerDef, container, out, cb) {
    logger.info('starting');
    out.stdout('starting');
    cb();
  };



  /**
   * stop the container on the target
   * target - target to deploy to
   * system - the target system defintinion
   * cdef - the contianer definition
   * container - the container as defined in the system topology
   * out - ouput stream
   * cb - complete callback
   */
  var stop = function stop(mode, target, system, containerDef, container, out, cb) {
    logger.info('stopping');
    out.stdout('stopping');
    cb();
  };



  /**
   * link the container to the target
   * target - target to deploy to
   * system - the target system defintinion
   * cdef - the contianer definition
   * container - the container as defined in the system topology
   * out - ouput stream
   * cb - complete callback
   */
  var link = function link(mode, target, system, containerDef, container, out, cb) {
    logger.info('linking');
    out.stdout('linking');
    cb();
  };



  /**
   * unlink the container from the target
   * target - target to deploy to
   * system - the target system defintinion
   * cdef - the contianer definition
   * container - the container as defined in the system topology
   * out - ouput stream
   * cb - complete callback
   */
  var unlink = function unlink(mode, target, system, containerDef, container, out, cb) {
    logger.info('unlinking');
    out.stdout('unlinking');
    cb();
  };



  return {
    build: build,
    deploy: deploy,
    start: start,
    stop: stop,
    link: link,
    unlink: unlink,
    undeploy: undeploy,
    add: deploy,
    remove: undeploy
  };
};
