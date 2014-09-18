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
var async = require('async');
var sd = require('nscale-util').sysdef();


module.exports = function(config, logger) {
  aws.config.update(config);

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
    var elb = new aws.ELB();
    /*
    var newZones = [];

    _.each(container.specific.AvailabilityZones, function(zone) {
      var source = zone.split('-');
      var target = config.region.split('-');
      newZones.push(target[0] + '-' + target[1] + '-' + target[2] + source[2].slice(-1));
    });
    container.specific.AvailabilityZones = newZones;
    */
    delete container.specific.AvailabilityZones;
    if (!container.specific.Subnets) {
      container.specific.Subnets = [config.defaultSubnetId];
    }

    out.preview({cmd: 'elb.createLoadBalancer(' + JSON.stringify(container.specific, null, 2) + ')', host: null, user: null, keyPath: null});
    if (mode === 'preview') {
      cb(null);
    }
    else {
      elb.createLoadBalancer(container.specific, function(err, data) {
        if (err) { return cb(err); }
        var replace = [{oldId: container.id, newId: data.DNSName}];
        target = sd.replaceId(container.id, data.DNSName, system);
        target.dirty = true;
        cb(null, target, replace);
      });
    }
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
    var elb = new aws.ELB();

    logger.info('linking');
    out.stdout('linking');

    out.preview({cmd: 'elb.registerInstancesWithLoadBalancer', host: null, user: null, keyPath: null});
    if (mode === 'preview') {
      cb(null);
    }
    else {
      elb.describeLoadBalancers({LoadBalancerNames : [container.specific.LoadBalancerName]}, function(err, data) {
        if (err) { return cb(err); }
        async.each(container.contains, function(containedId, next) {
          var linked = _.find(data.LoadBalancerDescriptions[0].Instances, function(instance) { return containedId === instance.InstanceId; });
          if (!linked) {
            elb.registerInstancesWithLoadBalancer({LoadBalancerName: container.specific.LoadBalancerName, Instances: [{InstanceId: containedId}]}, function(err) {
              next(err);
            });
          }
          else {
            next();
          }
        }, cb);
      });
    }
  };




//    - for each instance check if linked if not linked then link up
//      (unlink happends in containers don't unlink all here
/*
  elb.registerInstancesWithLoadBalancer({LoadBalancerName: lbName, Instances: [{InstanceId: instanceId}]}, function(err) {
    cb(err);
  });
    exports.balancerAdd(_elb, elbName, container.id, function(err) {
      cb(err);
    });
    */



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
